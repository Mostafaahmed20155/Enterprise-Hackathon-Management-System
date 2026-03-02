import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class LocalizedStringDto {
  @ApiProperty({ example: 'Great innovation!' })
  @IsString()
  en!: string;

  @ApiProperty({ example: 'ابتكار رائع!' })
  @IsString()
  ar!: string;
}

export class SubmitScoreDto {
  @ApiProperty({ example: 'clxxx...' })
  @IsString()
  submissionId!: string;

  @ApiProperty({ example: 'clxxx...' })
  @IsString()
  assignmentId!: string;

  @ApiProperty({
    example: { Innovation: 85, Technical: 90, Design: 80 },
    description: 'Scores for each criterion',
  })
  @IsObject()
  scores!: Record<string, number>;

  @ApiProperty({ type: LocalizedStringDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  feedback?: LocalizedStringDto;
}
