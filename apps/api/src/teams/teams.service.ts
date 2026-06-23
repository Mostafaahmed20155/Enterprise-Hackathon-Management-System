import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { EventState, InviteStatus } from '@ehms/database';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TeamsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  /**
   * Create a new team
   */
  async create(userId: string, dto: CreateTeamDto) {
    // Check if event exists and is in correct state
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });

    if (!event) {
      throw new NotFoundException({
        en: 'Event not found',
        ar: 'الفعالية غير موجودة',
      });
    }

    // Only allow team creation during TEAM_FORMATION or REGISTRATION_OPEN
    const allowedStates: EventState[] = [EventState.REGISTRATION_OPEN, EventState.TEAM_FORMATION];
    if (!allowedStates.includes(event.state as EventState)) {
      throw new ForbiddenException({
        en: 'Team creation is not allowed in current event state',
        ar: 'إنشاء الفريق غير مسموح في حالة الفعالية الحالية',
      });
    }

    // Check if user is registered for event (organizers are exempt)
    if (event.organizerId !== userId) {
      const registration = await this.prisma.eventRegistration.findUnique({
        where: {
          eventId_userId: {
            eventId: dto.eventId,
            userId,
          },
        },
      });

      if (!registration) {
        throw new ForbiddenException({
          en: 'You must register for the event before creating a team',
          ar: 'يجب التسجيل في الفعالية قبل إنشاء فريق',
        });
      }
    }

    // Check if user is already in a team for this event
    const existingMembership = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        team: {
          eventId: dto.eventId,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException({
        en: 'You are already part of a team for this event',
        ar: 'أنت بالفعل عضو في فريق لهذه الفعالية',
      });
    }

    // Create team
    const team = await this.prisma.team.create({
      data: {
        name: dto.name as any,
        description: dto.description as any,
        eventId: dto.eventId,
        leaderId: userId,
        members: {
          create: {
            userId,
            role: 'LEADER',
          },
        },
      },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
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
                skills: true,
              },
            },
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            state: true,
            maxTeamSize: true,
            minTeamSize: true,
          },
        },
      },
    });

    return team;
  }

  /**
   * Get all teams with filters
   */
  async findAll(eventId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
    };

    if (eventId) {
      where.eventId = eventId;
    }

    const teams = await this.prisma.team.findMany({
      where,
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            state: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.team.count({ where });

    return {
      data: teams,
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
   * Get team by ID
   */
  async findOne(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
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
                bio: true,
                skills: true,
              },
            },
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            state: true,
            maxTeamSize: true,
            minTeamSize: true,
          },
        },
        invites: {
          where: {
            status: InviteStatus.PENDING,
          },
          select: {
            id: true,
            email: true,
            status: true,
            expiresAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException({
        en: 'Team not found',
        ar: 'الفريق غير موجود',
      });
    }

    return team;
  }

  /**
   * Update team
   */
  async update(id: string, userId: string, dto: UpdateTeamDto) {
    const team = await this.prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      throw new NotFoundException({
        en: 'Team not found',
        ar: 'الفريق غير موجود',
      });
    }

    if (team.leaderId !== userId) {
      throw new ForbiddenException({
        en: 'Only team leader can update the team',
        ar: 'قائد الفريق فقط يمكنه تحديث الفريق',
      });
    }

    if (team.isLocked) {
      throw new ForbiddenException({
        en: 'Cannot update team during hacking phase',
        ar: 'لا يمكن تحديث الفريق خلال مرحلة الهاكاثون',
      });
    }

    return this.prisma.team.update({
      where: { id },
      data: {
        name: dto.name as any,
        description: dto.description as any,
      },
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
   * Delete team
   */
  async remove(id: string, userId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        event: true,
      },
    });

    if (!team) {
      throw new NotFoundException({
        en: 'Team not found',
        ar: 'الفريق غير موجود',
      });
    }

    if (team.leaderId !== userId) {
      throw new ForbiddenException({
        en: 'Only team leader can delete the team',
        ar: 'قائد الفريق فقط يمكنه حذف الفريق',
      });
    }

    if (team.isLocked) {
      throw new ForbiddenException({
        en: 'Cannot delete team during hacking phase',
        ar: 'لا يمكن حذف الفريق خلال مرحلة الهاكاثون',
      });
    }

    await this.prisma.team.delete({
      where: { id },
    });

    return {
      message: {
        en: 'Team deleted successfully',
        ar: 'تم حذف الفريق بنجاح',
      },
    };
  }

  /**
   * Invite member to team
   */
  async inviteMember(teamId: string, userId: string, dto: InviteMemberDto) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        event: true,
        members: true,
      },
    });

    if (!team) {
      throw new NotFoundException({
        en: 'Team not found',
        ar: 'الفريق غير موجود',
      });
    }

    if (team.leaderId !== userId) {
      throw new ForbiddenException({
        en: 'Only team leader can invite members',
        ar: 'قائد الفريق فقط يمكنه دعوة الأعضاء',
      });
    }

    if (team.isLocked) {
      throw new ForbiddenException({
        en: 'Cannot invite members during hacking phase',
        ar: 'لا يمكن دعوة الأعضاء خلال مرحلة الهاكاثون',
      });
    }

    // Check team size
    if (team.members.length >= team.event.maxTeamSize) {
      throw new BadRequestException({
        en: 'Team is full',
        ar: 'الفريق مكتمل',
      });
    }

    // Check if user exists
    const invitedUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Check if already a member
    if (invitedUser) {
      const existingMember = await this.prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: invitedUser.id,
        },
      });

      if (existingMember) {
        throw new ConflictException({
          en: 'User is already a team member',
          ar: 'المستخدم عضو في الفريق بالفعل',
        });
      }

      // Check if user is in another team for this event
      const otherTeamMembership = await this.prisma.teamMember.findFirst({
        where: {
          userId: invitedUser.id,
          team: {
            eventId: team.eventId,
          },
        },
      });

      if (otherTeamMembership) {
        throw new ConflictException({
          en: 'User is already in another team for this event',
          ar: 'المستخدم في فريق آخر لهذه الفعالية',
        });
      }
    }

    // Check for existing pending invite
    const existingInvite = await this.prisma.teamInvite.findFirst({
      where: {
        teamId,
        email: dto.email,
        status: InviteStatus.PENDING,
      },
    });

    if (existingInvite) {
      throw new ConflictException({
        en: 'Invite already sent to this email',
        ar: 'تم إرسال دعوة بالفعل لهذا البريد',
      });
    }

    // Create invite
    const expiresInDays = dto.expiresInDays || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invite = await this.prisma.teamInvite.create({
      data: {
        teamId,
        email: dto.email,
        userId: invitedUser?.id,
        expiresAt,
      },
    });

    // Notify the invited user if they already have an account
    if (invitedUser) {
      const teamName = (team.name as any)?.en || 'a team';
      await this.notifications.create({
        userId: invitedUser.id,
        type: 'TEAM_INVITE_RECEIVED',
        title: { en: 'Team Invitation', ar: 'دعوة للفريق' },
        body: {
          en: `You have been invited to join ${teamName}`,
          ar: `تمت دعوتك للانضمام إلى ${(team.name as any)?.ar || teamName}`,
        },
        link: '/teams',
      });
    }

    return {
      invite,
      message: {
        en: 'Invitation sent successfully',
        ar: 'تم إرسال الدعوة بنجاح',
      },
    };
  }

  /**
   * Accept or decline team invite
   */
  async respondToInvite(inviteId: string, userId: string, accept: boolean) {
    const invite = await this.prisma.teamInvite.findUnique({
      where: { id: inviteId },
      include: {
        team: {
          include: {
            event: true,
            members: true,
          },
        },
      },
    });

    if (!invite) {
      throw new NotFoundException({
        en: 'Invite not found',
        ar: 'الدعوة غير موجودة',
      });
    }

    // Verify invite is for this user — match by userId OR by email
    if (invite.userId !== userId) {
      const respondingUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      if (!respondingUser || invite.email !== respondingUser.email) {
        throw new ForbiddenException({
          en: 'This invite is not for you',
          ar: 'هذه الدعوة ليست لك',
        });
      }
      // Link this invite to the user's ID now that they've registered
      await this.prisma.teamInvite.update({
        where: { id: inviteId },
        data: { userId },
      });
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException({
        en: 'Invite has already been responded to',
        ar: 'تم الرد على الدعوة بالفعل',
      });
    }

    if (new Date() > invite.expiresAt) {
      await this.prisma.teamInvite.update({
        where: { id: inviteId },
        data: { status: InviteStatus.EXPIRED },
      });

      throw new BadRequestException({
        en: 'Invite has expired',
        ar: 'انتهت صلاحية الدعوة',
      });
    }

    if (invite.team.isLocked) {
      throw new ForbiddenException({
        en: 'Cannot join team during hacking phase',
        ar: 'لا يمكن الانضمام للفريق خلال مرحلة الهاكاثون',
      });
    }

    if (!accept) {
      // Decline invite
      await this.prisma.teamInvite.update({
        where: { id: inviteId },
        data: { status: InviteStatus.DECLINED },
      });

      // Notify the team leader
      const decliningUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      await this.notifications.create({
        userId: invite.team.leaderId,
        type: 'TEAM_INVITE_DECLINED',
        title: { en: 'Invitation Declined', ar: 'تم رفض الدعوة' },
        body: {
          en: `${decliningUser?.name || 'A user'} declined your team invitation`,
          ar: `${decliningUser?.name || 'مستخدم'} رفض دعوتك للفريق`,
        },
        link: '/teams',
      });

      return {
        message: {
          en: 'Invite declined',
          ar: 'تم رفض الدعوة',
        },
      };
    }

    // Accept invite
    // Check if user is already in another team for this event
    const existingMembership = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        team: {
          eventId: invite.team.eventId,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException({
        en: 'You are already in a team for this event',
        ar: 'أنت بالفعل في فريق لهذه الفعالية',
      });
    }

    // Check team size
    if (invite.team.members.length >= invite.team.event.maxTeamSize) {
      throw new BadRequestException({
        en: 'Team is full',
        ar: 'الفريق مكتمل',
      });
    }

    // Add user to team
    await this.prisma.teamMember.create({
      data: {
        teamId: invite.teamId,
        userId,
        role: 'MEMBER',
      },
    });

    // Update invite status
    await this.prisma.teamInvite.update({
      where: { id: inviteId },
      data: { status: InviteStatus.ACCEPTED },
    });

    // Notify the team leader
    const joiningUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    await this.notifications.create({
      userId: invite.team.leaderId,
      type: 'TEAM_INVITE_ACCEPTED',
      title: { en: 'Invitation Accepted', ar: 'تم قبول الدعوة' },
      body: {
        en: `${joiningUser?.name || 'A user'} accepted your invitation and joined the team`,
        ar: `${joiningUser?.name || 'مستخدم'} قبل دعوتك وانضم إلى الفريق`,
      },
      link: '/teams',
    });

    return {
      message: {
        en: 'Successfully joined the team',
        ar: 'تم الانضمام للفريق بنجاح',
      },
    };
  }

  /**
   * Remove member from team
   */
  async removeMember(teamId: string, userId: string, memberUserId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
      },
    });

    if (!team) {
      throw new NotFoundException({
        en: 'Team not found',
        ar: 'الفريق غير موجود',
      });
    }

    if (team.leaderId !== userId) {
      throw new ForbiddenException({
        en: 'Only team leader can remove members',
        ar: 'قائد الفريق فقط يمكنه إزالة الأعضاء',
      });
    }

    if (team.isLocked) {
      throw new ForbiddenException({
        en: 'Cannot remove members during hacking phase',
        ar: 'لا يمكن إزالة الأعضاء خلال مرحلة الهاكاثون',
      });
    }

    if (memberUserId === team.leaderId) {
      throw new BadRequestException({
        en: 'Cannot remove team leader',
        ar: 'لا يمكن إزالة قائد الفريق',
      });
    }

    const member = await this.prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: memberUserId,
      },
    });

    if (!member) {
      throw new NotFoundException({
        en: 'Member not found in team',
        ar: 'العضو غير موجود في الفريق',
      });
    }

    await this.prisma.teamMember.delete({
      where: { id: member.id },
    });

    return {
      message: {
        en: 'Member removed successfully',
        ar: 'تم إزالة العضو بنجاح',
      },
    };
  }

  /**
   * Get user's pending invites
   */
  async getUserInvites(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new NotFoundException({
        en: 'User not found',
        ar: 'المستخدم غير موجود',
      });
    }

    return this.prisma.teamInvite.findMany({
      where: {
        OR: [{ userId }, { email: user.email }],
        status: InviteStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      include: {
        team: {
          include: {
            leader: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            event: {
              select: {
                id: true,
                name: true,
                state: true,
              },
            },
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
