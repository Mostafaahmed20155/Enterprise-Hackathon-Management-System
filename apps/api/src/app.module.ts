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

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
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
  ],
})
export class AppModule {}
