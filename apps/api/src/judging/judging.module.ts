import { Module } from '@nestjs/common';
import { JudgingService } from './judging.service';
import { JudgingController } from './judging.controller';

@Module({
  controllers: [JudgingController],
  providers: [JudgingService],
  exports: [JudgingService],
})
export class JudgingModule {}
