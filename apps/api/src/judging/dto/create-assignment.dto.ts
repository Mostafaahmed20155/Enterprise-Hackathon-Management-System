import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ValidateNested, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class LocalizedStringDto {
  @ApiProperty({ example: 'Innovation' })
  @IsString()
  en!: string;

  @ApiProperty({ example: 'الابتكار' })
  @IsString()
  ar!: string;
}

export class JudgingCriterionDto {
  @ApiProperty({ type: LocalizedStringDto })
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name!: LocalizedStringDto;

  @ApiProperty({ example: 0.3, description: 'Weight (0-1, sum should be 1)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  weight!: number;

  @ApiProperty({ example: 100, description: 'Maximum score for this criterion' })
  @IsNumber()
  @Min(1)
  @Max(1000)
  maxScore!: number;
}

export class CreateJudgingAssignmentDto {
  @ApiProperty({ example: 'clxxx...' })
  @IsString()
  eventId!: string;

  @ApiProperty({ example: 'clxxx...' })
  @IsString()
  judgeId!: string;

  @ApiProperty({ type: [JudgingCriterionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JudgingCriterionDto)
  criteria!: JudgingCriterionDto[];
}
