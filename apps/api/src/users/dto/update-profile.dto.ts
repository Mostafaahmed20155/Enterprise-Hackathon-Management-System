import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsArray, IsUrl, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'أحمد محمد', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiProperty({ example: 'مطور برمجيات متحمس', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiProperty({ example: 'ar', enum: ['ar', 'en'], required: false })
  @IsOptional()
  @IsIn(['ar', 'en'])
  preferredLocale?: 'ar' | 'en';

  @ApiProperty({ example: 'Asia/Riyadh', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({
    example: [
      { name: { en: 'React', ar: 'React' }, level: 'advanced' },
      { name: { en: 'Node.js', ar: 'Node.js' }, level: 'intermediate' },
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  skills?: Array<{
    name: { en: string; ar: string };
    level?: string;
  }>;
}
