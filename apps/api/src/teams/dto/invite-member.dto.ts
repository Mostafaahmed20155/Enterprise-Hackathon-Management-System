import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 7, default: 7, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  expiresInDays?: number;
}
