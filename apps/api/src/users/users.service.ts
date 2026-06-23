import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get current user profile
   */
  async getCurrentUser(userId: string) {
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
      throw new NotFoundException({
        en: 'User not found',
        ar: 'المستخدم غير موجود',
      });
    }

    const { password, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Update current user profile
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        bio: dto.bio,
        avatar: dto.avatar,
        preferredLocale: dto.preferredLocale,
        timezone: dto.timezone,
        skills: dto.skills as any,
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    const { password, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Get user's teams
   */
  async getUserTeams(userId: string) {
    const teamMemberships = await this.prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
                state: true,
              },
            },
            leader: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return teamMemberships.map((tm) => tm.team);
  }

  // ============================================================================
  // ADMIN METHODS
  // ============================================================================

  /**
   * List all users (admin view — includes unverified users)
   */
  async listAllUsers(query?: string, role?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.userRoles = {
        some: { role: { name: role }, eventId: null },
      };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        emailVerified: true,
        preferredLocale: true,
        createdAt: true,
        userRoles: {
          where: { eventId: null },
          include: { role: { select: { name: true, displayName: true } } },
        },
        teamMemberships: {
          select: {
            team: {
              select: { id: true, name: true },
            },
          },
        },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get a specific user by ID (admin view — full profile + roles)
   */
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        skills: true,
        emailVerified: true,
        preferredLocale: true,
        timezone: true,
        createdAt: true,
        userRoles: {
          include: {
            role: { select: { id: true, name: true, displayName: true } },
            event: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException({ en: 'User not found', ar: 'المستخدم غير موجود' });
    }

    return user;
  }

  /**
   * Assign a global (platform-level) role to a user
   */
  async assignRole(targetUserId: string, roleName: string) {
    const [user, role] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } }),
      this.prisma.role.findUnique({ where: { name: roleName }, select: { id: true, name: true } }),
    ]);

    if (!user) throw new NotFoundException({ en: 'User not found', ar: 'المستخدم غير موجود' });
    if (!role) throw new NotFoundException({ en: 'Role not found', ar: 'الدور غير موجود' });

    const existing = await this.prisma.userRole.findFirst({
      where: { userId: targetUserId, roleId: role.id, eventId: null },
    });

    if (!existing) {
      await this.prisma.userRole.create({
        data: { userId: targetUserId, roleId: role.id, eventId: null },
      });
    }

    return this.getUserById(targetUserId);
  }

  /**
   * Remove a global (platform-level) role from a user
   */
  async removeRole(targetUserId: string, roleName: string) {
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
      select: { id: true },
    });

    if (!role) throw new NotFoundException({ en: 'Role not found', ar: 'الدور غير موجود' });

    await this.prisma.userRole.deleteMany({
      where: { userId: targetUserId, roleId: role.id, eventId: null },
    });

    return this.getUserById(targetUserId);
  }

  /**
   * Activate or deactivate a user account
   */
  async toggleUserStatus(targetUserId: string, active: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!user) throw new NotFoundException({ en: 'User not found', ar: 'المستخدم غير موجود' });

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { emailVerified: active },
      select: { id: true, emailVerified: true, name: true, email: true },
    });
  }

  /**
   * Permanently delete a user account (admin action)
   */
  async deleteUser(targetUserId: string, currentUserId: string) {
    if (targetUserId === currentUserId) {
      throw new BadRequestException({
        en: 'You cannot delete your own account',
        ar: 'لا يمكنك حذف حسابك الخاص',
      });
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException({ en: 'User not found', ar: 'المستخدم غير موجود' });
    }

    try {
      await this.prisma.user.delete({ where: { id: targetUserId } });
    } catch (error: any) {
      // P2003 / P2014 = referential integrity failure
      // (user owns events, leads teams, authored submissions, etc.)
      if (error?.code === 'P2003' || error?.code === 'P2014') {
        throw new BadRequestException({
          en: 'Cannot delete this user because they own events, lead teams, or have submissions. Reassign or remove those first.',
          ar: 'تعذّر حذف هذا المستخدم لأنه يملك فعاليات أو يقود فرقاً أو لديه مشاريع. أعد التعيين أو احذفها أولاً.',
        });
      }
      throw error;
    }

    return {
      message: { en: 'User deleted successfully', ar: 'تم حذف المستخدم بنجاح' },
    };
  }

  /**
   * Search users by skills or name
   */
  async searchUsers(
    query?: string,
    skills?: string[],
    role?: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.userRoles = {
        some: {
          role: { name: role },
        },
      };
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        skills: true,
        preferredLocale: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.user.count({ where });

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }
}
