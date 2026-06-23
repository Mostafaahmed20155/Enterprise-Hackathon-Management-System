import { Module } from '@nestjs/common';
import { JudgingService } from './judging.service';
import { JudgingController } from './judging.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [JudgingController],
  providers: [JudgingService],
  exports: [JudgingService],
})
export class JudgingModule {}
