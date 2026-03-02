import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventStateService } from './event-state.service';

@Module({
  controllers: [EventsController],
  providers: [EventsService, EventStateService],
  exports: [EventsService, EventStateService],
})
export class EventsModule {}
