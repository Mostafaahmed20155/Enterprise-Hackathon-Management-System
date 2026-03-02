import { PartialType } from '@nestjs/swagger';
import { SubmitScoreDto } from './submit-score.dto';
import { OmitType } from '@nestjs/swagger';

export class UpdateScoreDto extends PartialType(
  OmitType(SubmitScoreDto, ['submissionId', 'assignmentId'] as const),
) {}
