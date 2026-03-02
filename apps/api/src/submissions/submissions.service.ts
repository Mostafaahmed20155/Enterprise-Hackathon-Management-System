import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { EventState, SubmissionStatus } from '@ehms/database';

@Injectable()
export class SubmissionsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  /**
   * Create a new submission
   */
  async create(userId: string, dto: CreateSubmissionDto) {
    // Verify team membership
    const teamMember = await this.prisma.teamMember.findFirst({
      where: {
        teamId: dto.teamId,
        userId,
      },
      include: {
        team: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!teamMember) {
      throw new ForbiddenException({
        en: 'You are not a member of this team',
        ar: 'أنت لست عضوًا في هذا الفريق',
      });
    }

    // Verify event state
    const validStates: EventState[] = [
      EventState.HACKING_PHASE,
      EventState.SUBMISSION_CLOSED,
      EventState.JUDGING,
    ];

    if (!validStates.includes(teamMember.team.event.state as EventState)) {
      throw new ForbiddenException({
        en: 'Submissions are not allowed in current event state',
        ar: 'التقديمات غير مسموح بها في حالة الفعالية الحالية',
      });
    }

    // Check deadline
    if (
      new Date() > teamMember.team.event.hackingEnd &&
      !teamMember.team.event.allowLateSubmissions
    ) {
      throw new ForbiddenException({
        en: 'Submission deadline has passed',
        ar: 'انتهى الموعد النهائي للتقديم',
      });
    }

    // Check if submission already exists
    const existing = await this.prisma.submission.findUnique({
      where: {
        teamId_eventId: {
          teamId: dto.teamId,
          eventId: dto.eventId,
        },
      },
    });

    if (existing) {
      throw new ConflictException({
        en: 'Submission already exists for this team',
        ar: 'يوجد تقديم بالفعل لهذا الفريق',
      });
    }

    // Create submission
    const submission = await this.prisma.submission.create({
      data: {
        teamId: dto.teamId,
        eventId: dto.eventId,
        authorId: userId,
        title: dto.title as any,
        description: dto.description as any,
        demoUrl: dto.demoUrl,
        repoUrl: dto.repoUrl,
        videoUrl: dto.videoUrl,
        status: SubmissionStatus.DRAFT,
      },
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
        files: true,
      },
    });

    return submission;
  }

  /**
   * Get all submissions with filters
   */
  async findAll(
    eventId?: string,
    teamId?: string,
    status?: SubmissionStatus,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (eventId) {
      where.eventId = eventId;
    }

    if (teamId) {
      where.teamId = teamId;
    }

    if (status) {
      where.status = status;
    }

    const submissions = await this.prisma.submission.findMany({
      where,
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
        scores: {
          select: { totalScore: true },
        },
        _count: {
          select: {
            files: true,
            scores: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.submission.count({ where });

    const data = submissions.map((sub) => {
      const { scores, ...rest } = sub;
      const averageScore =
        scores.length > 0
          ? Math.round(
              (scores.reduce((sum, s) => sum + s.totalScore, 0) / scores.length) * 10,
            ) / 10
          : null;
      return { ...rest, averageScore };
    });

    return {
      data,
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
   * Get submission by ID
   */
  async findOne(id: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
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
        author: {
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
        files: {
          orderBy: { uploadedAt: 'desc' },
        },
        scores: {
          include: {
            judge: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException({
        en: 'Submission not found',
        ar: 'التقديم غير موجود',
      });
    }

    return submission;
  }

  /**
   * Update submission
   */
  async update(id: string, userId: string, dto: UpdateSubmissionDto) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException({
        en: 'Submission not found',
        ar: 'التقديم غير موجود',
      });
    }

    // Verify team membership
    const teamMember = await this.prisma.teamMember.findFirst({
      where: {
        teamId: submission.teamId,
        userId,
      },
    });

    if (!teamMember) {
      throw new ForbiddenException({
        en: 'You are not a member of this team',
        ar: 'أنت لست عضوًا في هذا الفريق',
      });
    }

    // Cannot update submitted submission
    if (submission.status === SubmissionStatus.SUBMITTED) {
      throw new ForbiddenException({
        en: 'Cannot update submitted submission',
        ar: 'لا يمكن تحديث تقديم تم إرساله',
      });
    }

    // Check deadline
    if (
      new Date() > submission.team.event.hackingEnd &&
      !submission.team.event.allowLateSubmissions
    ) {
      throw new ForbiddenException({
        en: 'Submission deadline has passed',
        ar: 'انتهى الموعد النهائي للتقديم',
      });
    }

    return this.prisma.submission.update({
      where: { id },
      data: {
        title: dto.title as any,
        description: dto.description as any,
        demoUrl: dto.demoUrl,
        repoUrl: dto.repoUrl,
        videoUrl: dto.videoUrl,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        files: true,
      },
    });
  }

  /**
   * Delete submission
   */
  async remove(id: string, userId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        team: true,
        files: true,
      },
    });

    if (!submission) {
      throw new NotFoundException({
        en: 'Submission not found',
        ar: 'التقديم غير موجود',
      });
    }

    // Only team leader or author can delete
    if (
      submission.team.leaderId !== userId &&
      submission.authorId !== userId
    ) {
      throw new ForbiddenException({
        en: 'Only team leader or submission author can delete',
        ar: 'قائد الفريق أو مؤلف التقديم فقط يمكنه الحذف',
      });
    }

    // Cannot delete submitted submission
    if (submission.status === SubmissionStatus.SUBMITTED) {
      throw new ForbiddenException({
        en: 'Cannot delete submitted submission',
        ar: 'لا يمكن حذف تقديم تم إرساله',
      });
    }

    // Delete files from storage
    for (const file of submission.files) {
      try {
        // Extract key from fileUrl
        const url = new URL(file.fileUrl);
        const key = url.pathname.split('/').slice(2).join('/'); // Remove /bucket-name/
        await this.storage.deleteFile(key);
      } catch (error) {
        console.error('Failed to delete file from storage:', error);
      }
    }

    await this.prisma.submission.delete({
      where: { id },
    });

    return {
      message: {
        en: 'Submission deleted successfully',
        ar: 'تم حذف التقديم بنجاح',
      },
    };
  }

  /**
   * Submit final submission (change status to SUBMITTED)
   */
  async submitFinal(id: string, userId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException({
        en: 'Submission not found',
        ar: 'التقديم غير موجود',
      });
    }

    // Verify team membership
    const teamMember = await this.prisma.teamMember.findFirst({
      where: {
        teamId: submission.teamId,
        userId,
      },
    });

    if (!teamMember) {
      throw new ForbiddenException({
        en: 'You are not a member of this team',
        ar: 'أنت لست عضوًا في هذا الفريق',
      });
    }

    if (submission.status === SubmissionStatus.SUBMITTED) {
      throw new BadRequestException({
        en: 'Submission is already submitted',
        ar: 'التقديم تم إرساله بالفعل',
      });
    }

    // Check deadline
    if (
      new Date() > submission.team.event.hackingEnd &&
      !submission.team.event.allowLateSubmissions
    ) {
      throw new ForbiddenException({
        en: 'Submission deadline has passed',
        ar: 'انتهى الموعد النهائي للتقديم',
      });
    }

    return this.prisma.submission.update({
      where: { id },
      data: {
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        files: true,
      },
    });
  }

  /**
   * Upload file to submission
   */
  async uploadFile(
    submissionId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        team: true,
      },
    });

    if (!submission) {
      throw new NotFoundException({
        en: 'Submission not found',
        ar: 'التقديم غير موجود',
      });
    }

    // Verify team membership
    const teamMember = await this.prisma.teamMember.findFirst({
      where: {
        teamId: submission.teamId,
        userId,
      },
    });

    if (!teamMember) {
      throw new ForbiddenException({
        en: 'You are not a member of this team',
        ar: 'أنت لست عضوًا في هذا الفريق',
      });
    }

    // Cannot upload to submitted submission
    if (submission.status === SubmissionStatus.SUBMITTED) {
      throw new ForbiddenException({
        en: 'Cannot upload files to submitted submission',
        ar: 'لا يمكن رفع ملفات لتقديم تم إرساله',
      });
    }

    // Upload to S3
    const uploadResult = await this.storage.uploadFile(
      file,
      `submissions/${submissionId}`,
    );

    // Save file metadata to database
    const submissionFile = await this.prisma.submissionFile.create({
      data: {
        submissionId,
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        mimeType: file.mimetype,
        uploadedBy: userId,
      },
    });

    return submissionFile;
  }

  /**
   * Delete file from submission
   */
  async deleteFile(submissionId: string, fileId: string, userId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        team: true,
      },
    });

    if (!submission) {
      throw new NotFoundException({
        en: 'Submission not found',
        ar: 'التقديم غير موجود',
      });
    }

    // Verify team membership
    const teamMember = await this.prisma.teamMember.findFirst({
      where: {
        teamId: submission.teamId,
        userId,
      },
    });

    if (!teamMember) {
      throw new ForbiddenException({
        en: 'You are not a member of this team',
        ar: 'أنت لست عضوًا في هذا الفريق',
      });
    }

    // Cannot delete from submitted submission
    if (submission.status === SubmissionStatus.SUBMITTED) {
      throw new ForbiddenException({
        en: 'Cannot delete files from submitted submission',
        ar: 'لا يمكن حذف ملفات من تقديم تم إرساله',
      });
    }

    const file = await this.prisma.submissionFile.findUnique({
      where: { id: fileId },
    });

    if (!file || file.submissionId !== submissionId) {
      throw new NotFoundException({
        en: 'File not found',
        ar: 'الملف غير موجود',
      });
    }

    // Delete from storage
    try {
      const url = new URL(file.fileUrl);
      const key = url.pathname.split('/').slice(2).join('/');
      await this.storage.deleteFile(key);
    } catch (error) {
      console.error('Failed to delete file from storage:', error);
    }

    // Delete from database
    await this.prisma.submissionFile.delete({
      where: { id: fileId },
    });

    return {
      message: {
        en: 'File deleted successfully',
        ar: 'تم حذف الملف بنجاح',
      },
    };
  }
}
