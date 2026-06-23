# Next Implementation Steps

This guide shows exactly what to implement next, with code templates and file locations.

## ✅ What's Already Done

1. Monorepo structure (Turborepo)
2. Docker Compose (PostgreSQL, Redis, MinIO)
3. Prisma database schema with bilingual JSONB
4. Shared TypeScript types package
5. Zod validation schemas
6. NestJS base application with:
   - Bilingual error handling
   - Response localization
   - Prisma integration
   - Common decorators and DTOs

## 🔴 Step 1: Implement Authentication (Priority 1)

### File: `apps/api/src/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') || '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshTokenStrategy, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

### File: `apps/api/src/auth/auth.controller.ts`

```typescript
import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout (revoke refresh token)' })
  async logout(@CurrentUser() user: any) {
    return this.authService.logout(user.sub);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @Get('oauth/google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {
    // Passport handles redirect
  }

  @Get('oauth/google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Req() req) {
    return this.authService.oauthLogin(req.user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: any) {
    return this.authService.getUserProfile(user.sub);
  }
}
```

### File: `apps/api/src/auth/auth.service.ts`

Implementation includes:
- bcrypt password hashing
- JWT token generation
- Refresh token storage in Redis
- Google OAuth user creation
- RBAC role assignment

### File: `apps/api/src/auth/strategies/jwt.strategy.ts`

JWT validation strategy using passport-jwt.

### File: `apps/api/src/auth/guards/jwt-auth.guard.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

### File: `apps/api/src/auth/guards/permissions.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check user permissions against required permissions
    // Implementation here...

    return true; // Placeholder
  }
}
```

## 🔴 Step 2: Implement Users Module

### File: `apps/api/src/users/users.module.ts`
### File: `apps/api/src/users/users.controller.ts`
### File: `apps/api/src/users/users.service.ts`

Features:
- GET /users/me (get current user)
- PATCH /users/me (update profile)
- GET /users/search (search users by skills)
- GET /users/me/teams (get user's teams)

## 🔴 Step 3: Implement Events Module

### File: `apps/api/src/events/events.module.ts`
### File: `apps/api/src/events/events.controller.ts`
### File: `apps/api/src/events/events.service.ts`
### File: `apps/api/src/events/event-state.service.ts`

Features:
- CRUD operations for events
- State machine implementation
- Scheduled auto-transitions (@Cron decorator)
- Event-scoped role assignments

State machine transitions:
```typescript
const transitions = [
  {
    from: EventState.DRAFT,
    to: EventState.PUBLISHED,
    guards: [hasRequiredFields, hasValidTimeline],
    sideEffects: [setPublishedDate],
  },
  {
    from: EventState.REGISTRATION_OPEN,
    to: EventState.TEAM_FORMATION,
    guards: [registrationEndedGuard],
    sideEffects: [sendRegistrationClosedEmail],
  },
  // ... more transitions
];
```

## 🔴 Step 4: Implement Teams Module

### File: `apps/api/src/teams/teams.module.ts`
### File: `apps/api/src/teams/teams.controller.ts`
### File: `apps/api/src/teams/teams.service.ts`

Features:
- Create team (requires event registration)
- Invite members (email-based)
- Accept/decline invites
- Remove members (leader only)
- Lock team (auto during HACKING_PHASE)

## 🔴 Step 5: Implement Storage Service

### File: `apps/api/src/storage/storage.module.ts`
### File: `apps/api/src/storage/storage.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class StorageService {
  private s3Client: S3Client;

  constructor(private config: ConfigService) {
    this.s3Client = new S3Client({
      endpoint: this.config.get('S3_ENDPOINT'),
      region: this.config.get('S3_REGION'),
      credentials: {
        accessKeyId: this.config.get('S3_ACCESS_KEY'),
        secretAccessKey: this.config.get('S3_SECRET_KEY'),
      },
      forcePathStyle: this.config.get('S3_FORCE_PATH_STYLE') === 'true',
    });
  }

  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.config.get('S3_BUCKET_NAME'),
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    return `${this.config.get('S3_ENDPOINT')}/${this.config.get('S3_BUCKET_NAME')}/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.config.get('S3_BUCKET_NAME'),
      Key: key,
    });

    await this.s3Client.send(command);
  }
}
```

## 🔴 Step 6: Implement Submissions Module

### File: `apps/api/src/submissions/submissions.module.ts`
### File: `apps/api/src/submissions/submissions.controller.ts`
### File: `apps/api/src/submissions/submissions.service.ts`

Features:
- Create submission (one per team per event)
- Update submission (before deadline)
- Upload files (using StorageService)
- Submit final (changes status to SUBMITTED)
- Enforce deadline (guard)

## 🔴 Step 7: Implement Judging Module

### File: `apps/api/src/judging/judging.module.ts`
### File: `apps/api/src/judging/judging.controller.ts`
### File: `apps/api/src/judging/judging.service.ts`

Features:
- Assign judges to events
- Define judging criteria
- Submit scores
- Calculate leaderboard
- Aggregate scores

## 🔴 Step 8: Setup Next.js Frontend

### Create Next.js App

```bash
cd apps
npx create-next-app@latest web --typescript --tailwind --app
```

### Install Dependencies

```bash
cd apps/web
npm install next-intl @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
  @tanstack/react-query axios zod react-hook-form @hookform/resolvers
npm install -D tailwindcss-rtl
```

### Configure next-intl

File: `apps/web/i18n/routing.ts`
```typescript
import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
```

### Configure Tailwind RTL

File: `apps/web/tailwind.config.js`
```javascript
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [require('tailwindcss-rtl')],
};
```

### Create Layout with dir attribute

File: `apps/web/app/[locale]/layout.tsx`
```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

## 🔴 Step 9: Create UI Components Package

### File: `packages/ui/src/components/button.tsx`

RTL-safe button using Tailwind logical properties:

```typescript
export const Button = ({ children, className, ...props }) => {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-md',
        'bg-blue-600 text-white',
        'hover:bg-blue-700',
        // Use logical properties
        'ps-4 pe-4', // padding-inline-start, padding-inline-end
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
```

## 🔴 Step 10: Create Translation Files

### File: `apps/web/messages/ar/common.json`

```json
{
  "nav": {
    "home": "الرئيسية",
    "events": "الفعاليات",
    "teams": "الفرق",
    "profile": "الملف الشخصي"
  },
  "auth": {
    "login": "تسجيل الدخول",
    "register": "إنشاء حساب",
    "logout": "تسجيل الخروج",
    "email": "البريد الإلكتروني",
    "password": "كلمة المرور",
    "name": "الاسم"
  },
  "common": {
    "save": "حفظ",
    "cancel": "إلغاء",
    "delete": "حذف",
    "edit": "تعديل",
    "submit": "إرسال",
    "loading": "جاري التحميل..."
  }
}
```

### File: `apps/web/messages/en/common.json`

```json
{
  "nav": {
    "home": "Home",
    "events": "Events",
    "teams": "Teams",
    "profile": "Profile"
  },
  "auth": {
    "login": "Login",
    "register": "Register",
    "logout": "Logout",
    "email": "Email",
    "password": "Password",
    "name": "Name"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "submit": "Submit",
    "loading": "Loading..."
  }
}
```

## Summary of Work Required

### Backend (NestJS) - Estimated 4-5 weeks
- [ ] Auth module (JWT + OAuth) - 1 week
- [ ] Users module - 3 days
- [ ] Events module + State machine - 1 week
- [ ] Teams module - 1 week
- [ ] Submissions module + Storage - 1 week
- [ ] Judging module - 3 days

### Frontend (Next.js) - Estimated 3-4 weeks
- [ ] Setup + i18n config - 2 days
- [ ] UI components package - 1 week
- [ ] Auth pages - 3 days
- [ ] Event pages - 1 week
- [ ] Team pages - 1 week
- [ ] Submission pages - 3 days
- [ ] Judging pages - 3 days

### Testing & Documentation - Estimated 1-2 weeks
- [ ] Unit tests
- [ ] E2E tests
- [ ] Visual regression tests
- [ ] API documentation
- [ ] User guides

**Total: 8-10 weeks for Phase 1 MVP**

## Tips for Implementation

1. **Build incrementally**: Complete one module at a time
2. **Test as you go**: Don't wait until the end
3. **Use Prisma Studio**: Great for debugging database issues
4. **Use Swagger**: Test API endpoints as you build them
5. **Follow the types**: TypeScript will guide you
6. **Arabic-first**: Always test with Arabic content first
7. **RTL testing**: Check every page in both RTL and LTR

## Getting Help

- Prisma schema: `packages/database/prisma/schema.prisma`
- Type definitions: `packages/types/src/`
- Validation schemas: `packages/validation/src/`
- API structure: `apps/api/src/`
