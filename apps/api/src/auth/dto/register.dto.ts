import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, Matches, IsIn } from 'class-validator';
import { bilingual } from '../../common/validation-messages';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail(
    {},
    { message: bilingual('Email must be a valid email address', 'يجب أن يكون البريد الإلكتروني صالحاً') }
  )
  email!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString({ message: bilingual('Password must be a string', 'يجب أن تكون كلمة المرور نصاً') })
  @MinLength(8, {
    message: bilingual(
      'Password must be at least 8 characters',
      'يجب ألا تقل كلمة المرور عن 8 أحرف'
    ),
  })
  @Matches(/[A-Z]/, {
    message: bilingual(
      'Password must contain at least one uppercase letter',
      'يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل'
    ),
  })
  @Matches(/[a-z]/, {
    message: bilingual(
      'Password must contain at least one lowercase letter',
      'يجب أن تحتوي كلمة المرور على حرف صغير واحد على الأقل'
    ),
  })
  @Matches(/[0-9]/, {
    message: bilingual(
      'Password must contain at least one number',
      'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل'
    ),
  })
  password!: string;

  @ApiProperty({ example: 'أحمد محمد' })
  @IsString({ message: bilingual('Name must be a string', 'يجب أن يكون الاسم نصاً') })
  @MinLength(2, {
    message: bilingual('Name must be at least 2 characters', 'يجب ألا يقل الاسم عن حرفين'),
  })
  name!: string;

  @ApiProperty({ example: 'ar', enum: ['ar', 'en'] })
  @IsIn(['ar', 'en'], {
    message: bilingual(
      'Preferred language must be either ar or en',
      'يجب أن تكون اللغة المفضلة إما ar أو en'
    ),
  })
  preferredLocale!: 'ar' | 'en';
}
