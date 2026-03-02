import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JudgingService } from './judging.service';
import { CreateJudgingAssignmentDto } from './dto/create-assignment.dto';
import { SubmitScoreDto } from './dto/submit-score.dto';
import { UpdateScoreDto } from './dto/update-score.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('judging')
@Controller('judging')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class JudgingController {
  constructor(private readonly judgingService: JudgingService) {}

  @Post('assignments')
  @RequirePermissions({ resource: 'JUDGING', action: 'ASSIGN' })
  @ApiOperation({ summary: 'Assign judge to event (organizer/admin only)' })
  createAssignment(@Body() dto: CreateJudgingAssignmentDto) {
    return this.judgingService.createAssignment(dto);
  }

  @Get('assignments')
  @RequirePermissions({ resource: 'JUDGING', action: 'READ' })
  @ApiOperation({ summary: 'Get current judge assignments' })
  getJudgeAssignments(@CurrentUser() user: any) {
    return this.judgingService.getJudgeAssignments(user.sub);
  }

  @Get('assignments/:assignmentId')
  @RequirePermissions({ resource: 'JUDGING', action: 'READ' })
  @ApiOperation({ summary: 'Get a single judging assignment' })
  getAssignment(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.judgingService.getAssignment(assignmentId, user.sub);
  }

  @Get('assignments/:assignmentId/submissions')
  @RequirePermissions({ resource: 'JUDGING', action: 'SCORE' })
  @ApiOperation({ summary: 'Get submissions for judge to score' })
  getSubmissionsForJudge(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.judgingService.getSubmissionsForJudge(assignmentId, user.sub);
  }

  @Post('scores')
  @RequirePermissions({ resource: 'JUDGING', action: 'SCORE' })
  @ApiOperation({ summary: 'Submit score for submission' })
  submitScore(@CurrentUser() user: any, @Body() dto: SubmitScoreDto) {
    return this.judgingService.submitScore(user.sub, dto);
  }

  @Patch('scores/:scoreId')
  @RequirePermissions({ resource: 'JUDGING', action: 'SCORE' })
  @ApiOperation({ summary: 'Update score' })
  updateScore(
    @Param('scoreId') scoreId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateScoreDto,
  ) {
    return this.judgingService.updateScore(scoreId, user.sub, dto);
  }

  @Get('events/:eventId/leaderboard')
  @Public()
  @ApiOperation({ summary: 'Get leaderboard for event' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getLeaderboard(
    @Param('eventId') eventId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    return this.judgingService.getLeaderboard(eventId, limit);
  }

  @Get('events/:eventId/stats')
  @RequirePermissions({ resource: 'JUDGING', action: 'READ' })
  @ApiOperation({ summary: 'Get judging statistics for event' })
  getJudgingStats(@Param('eventId') eventId: string) {
    return this.judgingService.getJudgingStats(eventId);
  }
}
