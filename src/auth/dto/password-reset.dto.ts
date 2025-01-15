import {
  IsString,
  MinLength,
  IsNotEmpty,
  Matches,
  Validate,
} from 'class-validator';
import { PasswordMatchConstraint } from './custom_validators/pw-match';

export class PasswordResetDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @Matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
  })
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  @Validate(PasswordMatchConstraint, ['newPassword'])
  confirmPassword: string;
}
