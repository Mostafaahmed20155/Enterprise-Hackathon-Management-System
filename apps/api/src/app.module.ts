import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { TeamsModule } from './teams/teams.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { JudgingModule } from './judging/judging.module';
import { StorageModule } from './storage/storage.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      // Same order as bootstrap-env.ts: base first, then overrides; apps/api wins over repo root.
      envFilePath: [
        join(process.cwd(), '.env'),
        join(process.cwd(), '.env.local'),
        join(process.cwd(), 'apps', 'api', '.env'),
        join(process.cwd(), 'apps', 'api', '.env.local'),
      ],
    }),

    // Scheduling for auto-transitions
    ScheduleModule.forRoot(),

    // Core modules
    PrismaModule,
    StorageModule,

    // Feature modules
    AuthModule,
    UsersModule,
    EventsModule,
    TeamsModule,
    SubmissionsModule,
    JudgingModule,
    NotificationsModule,
  ],
})
export class AppModule {}
