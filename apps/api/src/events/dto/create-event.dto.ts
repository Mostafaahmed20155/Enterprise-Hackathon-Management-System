import { ApiProperty } from '@nestjs/swagger';
import {
  IsObject,
  IsDate,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  IsString,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LocalizedStringDto {
  @ApiProperty({ example: 'Tech Hackathon 2024' })
  @IsString()
  en!: string;

  @ApiProperty({ example: 'هاكاثون التقنية 2024' })
  @IsString()
  ar!: string;
}

export class PrizeDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  place!: number;

  @ApiProperty({ type: LocalizedStringDto })
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name!: LocalizedStringDto;

  @ApiProperty({ example: 50000, required: false })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty({ example: 'SAR', required: false })
  @IsOptional()
  currency?: string;
}

export class CreateEventDto {
  @ApiProperty({ type: LocalizedStringDto })
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name!: LocalizedStringDto;

  @ApiProperty({ type: LocalizedStringDto })
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description!: LocalizedStringDto;

  @ApiProperty({ example: '2024-03-01T00:00:00Z' })
  @IsDate()
  @Type(() => Date)
  registrationStart!: Date;

  @ApiProperty({ example: '2024-03-15T00:00:00Z' })
  @IsDate()
  @Type(() => Date)
  registrationEnd!: Date;

  @ApiProperty({ example: '2024-03-16T00:00:00Z' })
  @IsDate()
  @Type(() => Date)
  hackingStart!: Date;

  @ApiProperty({ example: '2024-03-18T00:00:00Z' })
  @IsDate()
  @Type(() => Date)
  hackingEnd!: Date;

  @ApiProperty({ example: '2024-03-20T00:00:00Z', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  judgingEnd?: Date;

  @ApiProperty({ example: '2024-03-22T00:00:00Z', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  resultsDate?: Date;

  @ApiProperty({ example: 5, default: 5 })
  @IsNumber()
  @Min(2)
  @Max(20)
  maxTeamSize!: number;

  @ApiProperty({ example: 2, default: 2 })
  @IsNumber()
  @Min(1)
  @Max(10)
  minTeamSize!: number;

  @ApiProperty({ example: false, default: false })
  @IsBoolean()
  allowLateSubmissions!: boolean;

  @ApiProperty({ type: LocalizedStringDto, required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  rules?: LocalizedStringDto;

  @ApiProperty({ type: [PrizeDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrizeDto)
  prizes?: PrizeDto[];

  @ApiProperty({ type: LocalizedStringDto, required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  requirements?: LocalizedStringDto;
}
