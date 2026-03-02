import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class LocalizedStringDto {
  @ApiProperty({ example: 'Smart City Platform' })
  @IsString()
  en!: string;

  @ApiProperty({ example: 'منصة المدينة الذكية' })
  @IsString()
  ar!: string;
}

export class CreateSubmissionDto {
  @ApiProperty({ example: 'clxxx...' })
  @IsString()
  teamId!: string;

  @ApiProperty({ example: 'clxxx...' })
  @IsString()
  eventId!: string;

  @ApiProperty({ type: LocalizedStringDto })
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  title!: LocalizedStringDto;

  @ApiProperty({ type: LocalizedStringDto })
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description!: LocalizedStringDto;

  @ApiProperty({ example: 'https://demo.example.com', required: false })
  @IsOptional()
  @IsUrl()
  demoUrl?: string;

  @ApiProperty({ example: 'https://github.com/team/project', required: false })
  @IsOptional()
  @IsUrl()
  repoUrl?: string;

  @ApiProperty({ example: 'https://youtube.com/watch?v=...', required: false })
  @IsOptional()
  @IsUrl()
  videoUrl?: string;
}
