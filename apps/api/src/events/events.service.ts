import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventStateService } from './event-state.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventState } from '@ehms/database';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private eventStateService: EventStateService,
  ) {}

  /**
   * Create new event
   */
  async create(userId: string, dto: CreateEventDto) {
    const event = await this.prisma.event.create({
      data: {
        name: dto.name as any,
        description: dto.description as any,
        registrationStart: dto.registrationStart,
        registrationEnd: dto.registrationEnd,
        hackingStart: dto.hackingStart,
        hackingEnd: dto.hackingEnd,
        judgingEnd: dto.judgingEnd,
        resultsDate: dto.resultsDate,
        maxTeamSize: dto.maxTeamSize,
        minTeamSize: dto.minTeamSize,
        allowLateSubmissions: dto.allowLateSubmissions,
        rules: dto.rules as any,
        prizes: dto.prizes as any,
        requirements: dto.requirements as any,
        organizerId: userId,
        state: EventState.DRAFT,
      },
    });

    // Assign organizer role for this event
    const organizerRole = await this.prisma.role.findUnique({
      where: { name: 'ORGANIZER' },
    });

    if (organizerRole) {
      await this.prisma.userRole.create({
        data: {
          userId,
          roleId: organizerRole.id,
          eventId: event.id,
        },
      });
    }

    return event;
  }

  /**
   * Get all events with filters
   */
  async findAll(
    state?: EventState,
    search?: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (state) {
      where.state = state;
    }

    if (search) {
      // Search in name (JSONB) - simplified
      where.isPublished = true;
    }

    const events = await this.prisma.event.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            teams: true,
            submissions: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.event.count({ where });

    return {
      data: events,
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
   * Get event by ID
   */
  async findOne(id: string, userId?: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            teams: true,
            submissions: true,
            eventRegistrations: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException({
        en: 'Event not found',
        ar: 'الفعالية غير موجودة',
      });
    }

    // Check if user is registered (if userId provided)
    let isRegistered = false;
    if (userId) {
      const registration = await this.prisma.eventRegistration.findUnique({
        where: {
          eventId_userId: {
            eventId: id,
            userId,
          },
        },
      });
      isRegistered = !!registration;
    }

    return {
      ...event,
      isRegistered,
    };
  }

  /**
   * Update event
   */
  async update(id: string, userId: string, dto: UpdateEventDto) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException({
        en: 'Event not found',
        ar: 'الفعالية غير موجودة',
      });
    }

    if (event.organizerId !== userId) {
      throw new ForbiddenException({
        en: 'You can only update your own events',
        ar: 'يمكنك تحديث فعالياتك فقط',
      });
    }

    return this.prisma.event.update({
      where: { id },
      data: {
        name: dto.name as any,
        description: dto.description as any,
        registrationStart: dto.registrationStart,
        registrationEnd: dto.registrationEnd,
        hackingStart: dto.hackingStart,
        hackingEnd: dto.hackingEnd,
        judgingEnd: dto.judgingEnd,
        resultsDate: dto.resultsDate,
        maxTeamSize: dto.maxTeamSize,
        minTeamSize: dto.minTeamSize,
        allowLateSubmissions: dto.allowLateSubmissions,
        rules: dto.rules as any,
        prizes: dto.prizes as any,
        requirements: dto.requirements as any,
      },
    });
  }

  /**
   * Delete event
   */
  async remove(id: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException({
        en: 'Event not found',
        ar: 'الفعالية غير موجودة',
      });
    }

    if (event.organizerId !== userId) {
      throw new ForbiddenException({
        en: 'You can only delete your own events',
        ar: 'يمكنك حذف فعالياتك فقط',
      });
    }

    await this.prisma.event.delete({
      where: { id },
    });

    return {
      message: {
        en: 'Event deleted successfully',
        ar: 'تم حذف الفعالية بنجاح',
      },
    };
  }

  /**
   * Publish event (transition to PUBLISHED)
   */
  async publish(id: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException({
        en: 'Event not found',
        ar: 'الفعالية غير موجودة',
      });
    }

    if (event.organizerId !== userId) {
      throw new ForbiddenException({
        en: 'You can only publish your own events',
        ar: 'يمكنك نشر فعالياتك فقط',
      });
    }

    await this.eventStateService.transition(id, EventState.PUBLISHED);

    // Auto-transition to correct state based on current time
    const now = new Date();
    let updatedEvent = await this.prisma.event.findUnique({ where: { id } });
    if (!updatedEvent) return this.findOne(id);

    // Keep transitioning until we reach the correct state
    try {
      // PUBLISHED -> REGISTRATION_OPEN
      if (updatedEvent.state === EventState.PUBLISHED && updatedEvent.registrationStart <= now) {
        await this.eventStateService.transition(id, EventState.REGISTRATION_OPEN);
        const evt = await this.prisma.event.findUnique({ where: { id } });
        if (!evt) return this.findOne(id);
        updatedEvent = evt;
      }

      // REGISTRATION_OPEN -> TEAM_FORMATION
      if (updatedEvent.state === EventState.REGISTRATION_OPEN && updatedEvent.registrationEnd <= now) {
        await this.eventStateService.transition(id, EventState.TEAM_FORMATION);
        const evt = await this.prisma.event.findUnique({ where: { id } });
        if (!evt) return this.findOne(id);
        updatedEvent = evt;
      }

      // TEAM_FORMATION -> HACKING_PHASE
      if (updatedEvent.state === EventState.TEAM_FORMATION && updatedEvent.hackingStart <= now) {
        await this.eventStateService.transition(id, EventState.HACKING_PHASE);
        const evt = await this.prisma.event.findUnique({ where: { id } });
        if (!evt) return this.findOne(id);
        updatedEvent = evt;
      }

      // HACKING_PHASE -> SUBMISSION_CLOSED
      if (updatedEvent.state === EventState.HACKING_PHASE && updatedEvent.hackingEnd <= now) {
        await this.eventStateService.transition(id, EventState.SUBMISSION_CLOSED);
      }
    } catch (err) {
      console.log('Could not auto-transition event:', err);
    }

    return this.findOne(id);
  }

  /**
   * Manually trigger state transitions for event
   */
  async triggerTransition(id: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException({
        en: 'Event not found',
        ar: 'الفعالية غير موجودة',
      });
    }

    if (event.organizerId !== userId) {
      throw new ForbiddenException({
        en: 'Only event organizer can trigger state transitions',
        ar: 'منظم الفعالية فقط يمكنه تغيير حالة الفعالية',
      });
    }

    // Run the same auto-transition logic as publish
    const now = new Date();
    let updatedEvent = event;

    try {
      // PUBLISHED -> REGISTRATION_OPEN
      if (updatedEvent.state === EventState.PUBLISHED && updatedEvent.registrationStart <= now) {
        await this.eventStateService.transition(id, EventState.REGISTRATION_OPEN);
        const evt = await this.prisma.event.findUnique({ where: { id } });
        if (evt) updatedEvent = evt;
      }

      // REGISTRATION_OPEN -> TEAM_FORMATION
      if (updatedEvent.state === EventState.REGISTRATION_OPEN && updatedEvent.registrationEnd <= now) {
        await this.eventStateService.transition(id, EventState.TEAM_FORMATION);
        const evt = await this.prisma.event.findUnique({ where: { id } });
        if (evt) updatedEvent = evt;
      }

      // TEAM_FORMATION -> HACKING_PHASE
      if (updatedEvent.state === EventState.TEAM_FORMATION && updatedEvent.hackingStart <= now) {
        await this.eventStateService.transition(id, EventState.HACKING_PHASE);
        const evt = await this.prisma.event.findUnique({ where: { id } });
        if (evt) updatedEvent = evt;
      }

      // HACKING_PHASE -> SUBMISSION_CLOSED
      if (updatedEvent.state === EventState.HACKING_PHASE && updatedEvent.hackingEnd <= now) {
        await this.eventStateService.transition(id, EventState.SUBMISSION_CLOSED);
      }
    } catch (err) {
      console.log('Could not auto-transition event:', err);
    }

    return {
      ...await this.findOne(id),
      message: {
        en: 'Event state updated successfully',
        ar: 'تم تحديث حالة الفعالية بنجاح',
      },
    };
  }

  /**
   * Manually advance event to next state (for testing)
   */
  async advanceState(id: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException({
        en: 'Event not found',
        ar: 'الفعالية غير موجودة',
      });
    }

    if (event.organizerId !== userId) {
      throw new ForbiddenException({
        en: 'Only event organizer can advance event state',
        ar: 'منظم الفعالية فقط يمكنه تقديم حالة الفعالية',
      });
    }

    // Map current state to next state
    const stateFlow: Record<EventState, EventState | null> = {
      [EventState.DRAFT]: EventState.PUBLISHED,
      [EventState.PUBLISHED]: EventState.REGISTRATION_OPEN,
      [EventState.REGISTRATION_OPEN]: EventState.TEAM_FORMATION,
      [EventState.TEAM_FORMATION]: EventState.HACKING_PHASE,
      [EventState.HACKING_PHASE]: EventState.SUBMISSION_CLOSED,
      [EventState.SUBMISSION_CLOSED]: EventState.JUDGING,
      [EventState.JUDGING]: EventState.RESULTS_PUBLISHED,
      [EventState.RESULTS_PUBLISHED]: EventState.ARCHIVED,
      [EventState.ARCHIVED]: null, // No next state
    };

    const currentState = event.state as EventState;
    const nextState = stateFlow[currentState];

    if (!nextState) {
      throw new BadRequestException({
        en: 'Event is already in final state',
        ar: 'الفعالية في الحالة النهائية بالفعل',
      });
    }

    // Transition to next state
    await this.eventStateService.transition(id, nextState);

    return {
      ...await this.findOne(id),
      message: {
        en: `Event advanced from ${currentState} to ${nextState}`,
        ar: `تم تقديم الفعالية من ${currentState} إلى ${nextState}`,
      },
    };
  }

  /**
   * Get all registrations for an event (admin/organizer view)
   */
  async getRegistrations(eventId: string) {
    const registrations = await this.prisma.eventRegistration.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
    });

    if (registrations.length === 0) {
      return { data: [], total: 0 };
    }

    const userIds = registrations.map(r => r.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, avatar: true, preferredLocale: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    return {
      data: registrations.map(r => ({
        id: r.id,
        status: r.status,
        registeredAt: r.createdAt,
        user: userMap.get(r.userId) ?? { id: r.userId, name: 'Unknown', email: '' },
      })),
      total: registrations.length,
    };
  }

  /**
   * Register user for event
   */
  async register(eventId: string, userId: string) {
    const event = await this.findOne(eventId);

    if (event.state !== EventState.REGISTRATION_OPEN) {
      throw new ForbiddenException({
        en: 'Event registration is not open',
        ar: 'التسجيل للفعالية غير مفتوح',
      });
    }

    // Check if already registered
    const existing = await this.prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (existing) {
      throw new ForbiddenException({
        en: 'You are already registered for this event',
        ar: 'أنت مسجل بالفعل في هذه الفعالية',
      });
    }

    await this.prisma.eventRegistration.create({
      data: {
        eventId,
        userId,
        status: 'REGISTERED',
      },
    });

    return {
      message: {
        en: 'Successfully registered for event',
        ar: 'تم التسجيل في الفعالية بنجاح',
      },
    };
  }

  /**
   * Get event teams
   */
  async getTeams(eventId: string) {
    return this.prisma.team.findMany({
      where: { eventId },
      include: {
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
    });
  }

  /**
   * Get event submissions
   */
  async getSubmissions(eventId: string) {
    return this.prisma.submission.findMany({
      where: { eventId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            files: true,
          },
        },
      },
    });
  }
}
