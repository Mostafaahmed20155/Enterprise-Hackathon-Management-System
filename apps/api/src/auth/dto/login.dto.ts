import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { bilingual } from '../../common/validation-messages';

export class LoginDto {
  @ApiProperty({ example: 'admin@ehms.com' })
  @IsEmail(
    {},
    { message: bilingual('Email must be a valid email address', 'يجب أن يكون البريد الإلكتروني صالحاً') }
  )
  email!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString({ message: bilingual('Password must be a string', 'يجب أن تكون كلمة المرور نصاً') })
  @MinLength(1, { message: bilingual('Password is required', 'كلمة المرور مطلوبة') })
  password!: string;
}
