import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class LocalizedStringDto {
  @ApiProperty({ example: 'Tech Innovators' })
  @IsString()
  en!: string;

  @ApiProperty({ example: 'المبتكرون التقنيون' })
  @IsString()
  ar!: string;
}

export class CreateTeamDto {
  @ApiProperty({ type: LocalizedStringDto })
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name!: LocalizedStringDto;

  @ApiProperty({ type: LocalizedStringDto, required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description?: LocalizedStringDto;

  @ApiProperty({ example: 'clxxx...' })
  @IsString()
  eventId!: string;
}
