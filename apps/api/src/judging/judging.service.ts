import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJudgingAssignmentDto } from './dto/create-assignment.dto';
import { SubmitScoreDto } from './dto/submit-score.dto';
import { UpdateScoreDto } from './dto/update-score.dto';
import { EventState } from '@ehms/database';

@Injectable()
export class JudgingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create judging assignment
   */
  async createAssignment(dto: CreateJudgingAssignmentDto) {
    // Verify event exists
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });

    if (!event) {
      throw new NotFoundException({
        en: 'Event not found',
        ar: 'الفعالية غير موجودة',
      });
    }

    // Verify judge exists and has JUDGE role
    const judge = await this.prisma.user.findUnique({
      where: { id: dto.judgeId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!judge) {
      throw new NotFoundException({
        en: 'Judge not found',
        ar: 'الحكم غير موجود',
      });
    }

    const hasJudgeRole = judge.userRoles.some((ur) => ur.role.name === 'JUDGE');
    if (!hasJudgeRole) {
      throw new BadRequestException({
        en: 'User is not a judge',
        ar: 'المستخدم ليس حكماً',
      });
    }

    // Check if assignment already exists
    const existing = await this.prisma.judgingAssignment.findUnique({
      where: {
        eventId_judgeId: {
          eventId: dto.eventId,
          judgeId: dto.judgeId,
        },
      },
    });

    if (existing) {
      throw new ConflictException({
        en: 'Judge is already assigned to this event',
        ar: 'الحكم مُعيّن بالفعل لهذه الفعالية',
      });
    }

    // Validate criteria weights sum to 1
    const totalWeight = dto.criteria.reduce((sum, c) => sum + c.weight, 0);
    if (Math.abs(totalWeight - 1) > 0.01) {
      throw new BadRequestException({
        en: 'Criteria weights must sum to 1',
        ar: 'يجب أن يكون مجموع أوزان المعايير 1',
      });
    }

    // Create assignment
    const assignment = await this.prisma.judgingAssignment.create({
      data: {
        eventId: dto.eventId,
        judgeId: dto.judgeId,
        criteria: dto.criteria as any,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            state: true,
          },
        },
        judge: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return assignment;
  }

  /**
   * Get judge's assignments
   */
  async getJudgeAssignments(judgeId: string) {
    return this.prisma.judgingAssignment.findMany({
      where: { judgeId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            state: true,
          },
        },
        _count: {
          select: {
            scores: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  /**
   * Get a single assignment (for the owning judge only)
   */
  async getAssignment(assignmentId: string, judgeId: string) {
    const assignment = await this.prisma.judgingAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            state: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException({
        en: 'Assignment not found',
        ar: 'التعيين غير موجود',
      });
    }

    if (assignment.judgeId !== judgeId) {
      throw new ForbiddenException({
        en: 'This assignment is not for you',
        ar: 'هذا التعيين ليس لك',
      });
    }

    return assignment;
  }

  /**
   * Get submissions for judge to score
   */
  async getSubmissionsForJudge(assignmentId: string, judgeId: string) {
    const assignment = await this.prisma.judgingAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        event: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException({
        en: 'Assignment not found',
        ar: 'التعيين غير موجود',
      });
    }

    if (assignment.judgeId !== judgeId) {
      throw new ForbiddenException({
        en: 'This assignment is not for you',
        ar: 'هذا التعيين ليس لك',
      });
    }

    // Get all submitted submissions for this event
    const submissions = await this.prisma.submission.findMany({
      where: {
        eventId: assignment.eventId,
        status: 'SUBMITTED',
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        scores: {
          where: {
            judgeId,
          },
          select: {
            id: true,
            totalScore: true,
            scores: true,
            feedback: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            files: true,
          },
        },
      },
      orderBy: { submittedAt: 'asc' },
    });

    return submissions;
  }

  /**
   * Submit score for submission
   */
  async submitScore(judgeId: string, dto: SubmitScoreDto) {
    // Verify assignment
    const assignment = await this.prisma.judgingAssignment.findUnique({
      where: { id: dto.assignmentId },
      include: {
        event: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException({
        en: 'Assignment not found',
        ar: 'التعيين غير موجود',
      });
    }

    if (assignment.judgeId !== judgeId) {
      throw new ForbiddenException({
        en: 'This assignment is not for you',
        ar: 'هذا التعيين ليس لك',
      });
    }

    // Verify event is in JUDGING state
    if (assignment.event.state !== EventState.JUDGING) {
      throw new ForbiddenException({
        en: 'Judging is not open for this event',
        ar: 'التحكيم غير متاح لهذه الفعالية',
      });
    }

    // Verify submission exists and is submitted
    const submission = await this.prisma.submission.findUnique({
      where: { id: dto.submissionId },
    });

    if (!submission) {
      throw new NotFoundException({
        en: 'Submission not found',
        ar: 'التقديم غير موجود',
      });
    }

    if (submission.eventId !== assignment.eventId) {
      throw new BadRequestException({
        en: 'Submission is not for this event',
        ar: 'التقديم ليس لهذه الفعالية',
      });
    }

    if (submission.status !== 'SUBMITTED') {
      throw new BadRequestException({
        en: 'Can only score submitted submissions',
        ar: 'يمكن تقييم التقديمات المرسلة فقط',
      });
    }

    // Check if already scored by this judge
    const existingScore = await this.prisma.judgingScore.findUnique({
      where: {
        submissionId_assignmentId: {
          submissionId: dto.submissionId,
          assignmentId: dto.assignmentId,
        },
      },
    });

    if (existingScore) {
      throw new ConflictException({
        en: 'You have already scored this submission',
        ar: 'لقد قيمت هذا التقديم بالفعل',
      });
    }

    // Validate scores against criteria
    const criteria = assignment.criteria as any[];
    const criteriaNames = criteria.map((c) => c.name.en);

    for (const criterionName of Object.keys(dto.scores)) {
      if (!criteriaNames.includes(criterionName)) {
        throw new BadRequestException({
          en: `Invalid criterion: ${criterionName}`,
          ar: `معيار غير صالح: ${criterionName}`,
        });
      }

      const criterion = criteria.find((c) => c.name.en === criterionName);
      if (dto.scores[criterionName] > criterion.maxScore) {
        throw new BadRequestException({
          en: `Score for ${criterionName} exceeds maximum of ${criterion.maxScore}`,
          ar: `درجة ${criterionName} تتجاوز الحد الأقصى ${criterion.maxScore}`,
        });
      }
    }

    // Calculate total score (weighted)
    let totalScore = 0;
    for (const criterion of criteria) {
      const score = dto.scores[criterion.name.en] || 0;
      const normalizedScore = (score / criterion.maxScore) * 100;
      totalScore += normalizedScore * criterion.weight;
    }

    // Create score
    const score = await this.prisma.judgingScore.create({
      data: {
        submissionId: dto.submissionId,
        assignmentId: dto.assignmentId,
        judgeId,
        scores: dto.scores as any,
        totalScore,
        feedback: dto.feedback as any,
      },
      include: {
        submission: {
          select: {
            id: true,
            title: true,
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        judge: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return score;
  }

  /**
   * Update score
   */
  async updateScore(scoreId: string, judgeId: string, dto: UpdateScoreDto) {
    const score = await this.prisma.judgingScore.findUnique({
      where: { id: scoreId },
      include: {
        assignment: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!score) {
      throw new NotFoundException({
        en: 'Score not found',
        ar: 'التقييم غير موجود',
      });
    }

    if (score.judgeId !== judgeId) {
      throw new ForbiddenException({
        en: 'You can only update your own scores',
        ar: 'يمكنك تحديث تقييماتك فقط',
      });
    }

    // Verify event is still in JUDGING state
    if (score.assignment.event.state !== EventState.JUDGING) {
      throw new ForbiddenException({
        en: 'Judging is closed for this event',
        ar: 'التحكيم مغلق لهذه الفعالية',
      });
    }

    // Calculate new total score if scores changed
    let totalScore = score.totalScore;
    if (dto.scores) {
      const criteria = score.assignment.criteria as any[];
      totalScore = 0;
      for (const criterion of criteria) {
        const newScore = dto.scores[criterion.name.en] || 0;
        const normalizedScore = (newScore / criterion.maxScore) * 100;
        totalScore += normalizedScore * criterion.weight;
      }
    }

    return this.prisma.judgingScore.update({
      where: { id: scoreId },
      data: {
        scores: dto.scores as any,
        totalScore,
        feedback: dto.feedback as any,
      },
      include: {
        submission: {
          select: {
            id: true,
            title: true,
          },
        },
        judge: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get leaderboard for event
   */
  async getLeaderboard(eventId: string, limit = 50) {
    // Get all submissions with their scores
    const submissions = await this.prisma.submission.findMany({
      where: {
        eventId,
        status: 'SUBMITTED',
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        scores: {
          select: {
            totalScore: true,
            judgeId: true,
          },
        },
      },
    });

    // Calculate average score for each submission
    const leaderboard = submissions
      .map((submission) => {
        const scores = submission.scores.map((s) => s.totalScore);
        const averageScore = scores.length > 0
          ? scores.reduce((sum, s) => sum + s, 0) / scores.length
          : 0;

        return {
          submissionId: submission.id,
          submissionSlug: submission.slug,
          teamId: submission.team.id,
          teamName: submission.team.name,
          title: submission.title,
          totalScore: averageScore,
          judgeCount: submission.scores.length,
          rank: 0, // Will be assigned after sorting
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);

    // Assign ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return leaderboard;
  }

  /**
   * Get judging statistics for event
   */
  async getJudgingStats(eventId: string) {
    const totalSubmissions = await this.prisma.submission.count({
      where: {
        eventId,
        status: 'SUBMITTED',
      },
    });

    const scores = await this.prisma.judgingScore.findMany({
      where: {
        submission: {
          eventId,
        },
      },
      select: {
        totalScore: true,
        submissionId: true,
      },
    });

    const scoredSubmissions = new Set(scores.map((s) => s.submissionId)).size;
    const averageScore = scores.length > 0
      ? scores.reduce((sum, s) => sum + s.totalScore, 0) / scores.length
      : 0;

    const completionPercentage =
      totalSubmissions > 0 ? (scoredSubmissions / totalSubmissions) * 100 : 0;

    return {
      totalSubmissions,
      scoredSubmissions,
      pendingSubmissions: totalSubmissions - scoredSubmissions,
      averageScore: Math.round(averageScore * 100) / 100,
      completionPercentage: Math.round(completionPercentage * 100) / 100,
    };
  }
}
