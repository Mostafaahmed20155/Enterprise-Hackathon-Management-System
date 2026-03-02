import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  /**
   * Register a new user
   */
  async register(dto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException({
        en: 'User with this email already exists',
        ar: 'المستخدم بهذا البريد الإلكتروني موجود بالفعل',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        preferredLocale: dto.preferredLocale,
        emailVerified: false,
      },
    });

    // Assign PARTICIPANT role by default
    const participantRole = await this.prisma.role.findUnique({
      where: { name: 'PARTICIPANT' },
    });

    if (participantRole) {
      await this.prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: participantRole.id,
        },
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Login user
   */
  async login(dto: LoginDto) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException({
        en: 'Invalid credentials',
        ar: 'بيانات الدخول غير صحيحة',
      });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException({
        en: 'Invalid credentials',
        ar: 'بيانات الدخول غير صحيحة',
      });
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Change the authenticated user's password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.password) {
      throw new UnauthorizedException({ en: 'Cannot change password for OAuth accounts', ar: 'لا يمكن تغيير كلمة المرور لحسابات OAuth' });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      throw new UnauthorizedException({ en: 'Current password is incorrect', ar: 'كلمة المرور الحالية غير صحيحة' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    return { message: { en: 'Password changed successfully', ar: 'تم تغيير كلمة المرور بنجاح' } };
  }

  /**
   * Logout user (revoke refresh token)
   */
  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      message: {
        en: 'Logged out successfully',
        ar: 'تم تسجيل الخروج بنجاح',
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException({
        en: 'Refresh token is required',
        ar: 'رمز التحديث مطلوب',
      });
    }

    // Find refresh token
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.revokedAt) {
      throw new UnauthorizedException({
        en: 'Invalid refresh token',
        ar: 'رمز التحديث غير صالح',
      });
    }

    // Check if expired
    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException({
        en: 'Refresh token expired',
        ar: 'انتهت صلاحية رمز التحديث',
      });
    }

    // Verify token
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_SECRET'),
      });

      // Generate new tokens
      const tokens = await this.generateTokens(payload.sub, payload.email);

      // Revoke old refresh token
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      return tokens;
    } catch (error) {
      throw new UnauthorizedException({
        en: 'Invalid refresh token',
        ar: 'رمز التحديث غير صالح',
      });
    }
  }

  /**
   * OAuth login (Google)
   */
  async oauthLogin(oauthUser: any) {
    if (!oauthUser) {
      throw new UnauthorizedException({
        en: 'OAuth authentication failed',
        ar: 'فشل المصادقة عبر OAuth',
      });
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email: oauthUser.email },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email: oauthUser.email,
          name: oauthUser.name,
          avatar: oauthUser.picture,
          googleId: oauthUser.googleId,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          preferredLocale: 'ar', // Default to Arabic
        },
      });

      // Assign PARTICIPANT role
      const participantRole = await this.prisma.role.findUnique({
        where: { name: 'PARTICIPANT' },
      });

      if (participantRole) {
        await this.prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: participantRole.id,
          },
        });
      }
    } else if (!user.googleId) {
      // Link Google account to existing user
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: oauthUser.googleId,
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Get user profile with roles
   */
  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
            event: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        en: 'User not found',
        ar: 'المستخدم غير موجود',
      });
    }

    return this.sanitizeUser(user);
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(userId: string, email: string) {
    const payload = {
      sub: userId,
      email,
    };

    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get('JWT_EXPIRES_IN') || '15m',
    });

    // Generate refresh token
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get('REFRESH_TOKEN_EXPIRES_IN') || '7d',
    });

    // Store refresh token
    const expiresIn = this.config.get('REFRESH_TOKEN_EXPIRES_IN') || '7d';
    const expiresInMs = this.parseExpiresIn(expiresIn);
    const expiresAt = new Date(Date.now() + expiresInMs);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiresIn(this.config.get('JWT_EXPIRES_IN') || '15m') / 1000,
    };
  }

  /**
   * Parse expires in string to milliseconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 15 * 60 * 1000; // Default 15 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 15 * 60 * 1000;
    }
  }

  /**
   * Remove sensitive fields from user object
   */
  private sanitizeUser(user: any) {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}
