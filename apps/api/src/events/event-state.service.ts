import { Injectable, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EventState } from '@ehms/database';

interface StateTransition {
  from: EventState;
  to: EventState;
  guards: Array<(event: any) => boolean>;
  sideEffects?: Array<(event: any) => Promise<void>>;
}

@Injectable()
export class EventStateService {
  private transitions: StateTransition[] = [
    {
      from: EventState.DRAFT,
      to: EventState.PUBLISHED,
      guards: [
        (event) => !!event.name,
        (event) => !!event.description,
        (event) => !!event.registrationStart,
        (event) => !!event.registrationEnd,
        (event) => !!event.hackingStart,
        (event) => !!event.hackingEnd,
      ],
      sideEffects: [
        async (event) => {
          console.log(`Event ${event.id} published`);
        },
      ],
    },
    {
      from: EventState.PUBLISHED,
      to: EventState.REGISTRATION_OPEN,
      guards: [(event) => new Date() >= event.registrationStart],
    },
    {
      from: EventState.REGISTRATION_OPEN,
      to: EventState.TEAM_FORMATION,
      guards: [(event) => new Date() >= event.registrationEnd],
    },
    {
      from: EventState.TEAM_FORMATION,
      to: EventState.HACKING_PHASE,
      guards: [(event) => new Date() >= event.hackingStart],
      sideEffects: [
        async (event) => {
          // Lock all teams when hacking phase starts
          await this.prisma.team.updateMany({
            where: { eventId: event.id, isLocked: false },
            data: { isLocked: true, lockedAt: new Date() },
          });
          console.log(`Locked all teams for event ${event.id}`);
        },
      ],
    },
    {
      from: EventState.HACKING_PHASE,
      to: EventState.SUBMISSION_CLOSED,
      guards: [(event) => new Date() >= event.hackingEnd],
    },
    {
      from: EventState.SUBMISSION_CLOSED,
      to: EventState.JUDGING,
      guards: [(event) => true], // Manual transition
    },
    {
      from: EventState.JUDGING,
      to: EventState.RESULTS_PUBLISHED,
      guards: [
        (event) => !event.judgingEnd || new Date() >= event.judgingEnd,
      ],
    },
    {
      from: EventState.RESULTS_PUBLISHED,
      to: EventState.ARCHIVED,
      guards: [(event) => true], // Manual transition
    },
  ];

  constructor(private prisma: PrismaService) {}

  /**
   * Transition event to new state
   */
  async transition(eventId: string, toState: EventState): Promise<void> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new BadRequestException({
        en: 'Event not found',
        ar: 'الفعالية غير موجودة',
      });
    }

    // Find matching transition
    const transition = this.transitions.find(
      (t) => t.from === event.state && t.to === toState,
    );

    if (!transition) {
      throw new BadRequestException({
        en: `Cannot transition from ${event.state} to ${toState}`,
        ar: `لا يمكن الانتقال من ${event.state} إلى ${toState}`,
      });
    }

    // Validate guards
    for (const guard of transition.guards) {
      if (!guard(event)) {
        throw new BadRequestException({
          en: 'Transition requirements not met',
          ar: 'متطلبات الانتقال غير مستوفاة',
        });
      }
    }

    // Update state
    await this.prisma.event.update({
      where: { id: eventId },
      data: {
        state: toState,
        ...(toState === EventState.PUBLISHED && { publishedAt: new Date() }),
        ...(toState === EventState.ARCHIVED && { archivedAt: new Date() }),
      },
    });

    // Execute side effects
    if (transition.sideEffects) {
      for (const effect of transition.sideEffects) {
        await effect(event);
      }
    }
  }

  /**
   * Auto-transition events based on timestamps
   * Runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async autoTransitionEvents(): Promise<void> {
    console.log('Running auto-transition check...');

    const now = new Date();

    // PUBLISHED → REGISTRATION_OPEN
    const publishedEvents = await this.prisma.event.findMany({
      where: {
        state: EventState.PUBLISHED,
        registrationStart: { lte: now },
      },
    });

    for (const event of publishedEvents) {
      try {
        await this.transition(event.id, EventState.REGISTRATION_OPEN);
        console.log(`Auto-transitioned event ${event.id} to REGISTRATION_OPEN`);
      } catch (error) {
        console.error(`Failed to transition event ${event.id}:`, error);
      }
    }

    // REGISTRATION_OPEN → TEAM_FORMATION
    const openEvents = await this.prisma.event.findMany({
      where: {
        state: EventState.REGISTRATION_OPEN,
        registrationEnd: { lte: now },
      },
    });

    for (const event of openEvents) {
      try {
        await this.transition(event.id, EventState.TEAM_FORMATION);
        console.log(`Auto-transitioned event ${event.id} to TEAM_FORMATION`);
      } catch (error) {
        console.error(`Failed to transition event ${event.id}:`, error);
      }
    }

    // TEAM_FORMATION → HACKING_PHASE
    const formationEvents = await this.prisma.event.findMany({
      where: {
        state: EventState.TEAM_FORMATION,
        hackingStart: { lte: now },
      },
    });

    for (const event of formationEvents) {
      try {
        await this.transition(event.id, EventState.HACKING_PHASE);
        console.log(`Auto-transitioned event ${event.id} to HACKING_PHASE`);
      } catch (error) {
        console.error(`Failed to transition event ${event.id}:`, error);
      }
    }

    // HACKING_PHASE → SUBMISSION_CLOSED
    const hackingEvents = await this.prisma.event.findMany({
      where: {
        state: EventState.HACKING_PHASE,
        hackingEnd: { lte: now },
      },
    });

    for (const event of hackingEvents) {
      try {
        await this.transition(event.id, EventState.SUBMISSION_CLOSED);
        console.log(`Auto-transitioned event ${event.id} to SUBMISSION_CLOSED`);
      } catch (error) {
        console.error(`Failed to transition event ${event.id}:`, error);
      }
    }

    // JUDGING → RESULTS_PUBLISHED
    const judgingEvents = await this.prisma.event.findMany({
      where: {
        state: EventState.JUDGING,
        judgingEnd: { lte: now },
      },
    });

    for (const event of judgingEvents) {
      try {
        await this.transition(event.id, EventState.RESULTS_PUBLISHED);
        console.log(`Auto-transitioned event ${event.id} to RESULTS_PUBLISHED`);
      } catch (error) {
        console.error(`Failed to transition event ${event.id}:`, error);
      }
    }
  }
}
