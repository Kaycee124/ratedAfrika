import {
  IsEmail,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  MinLength,
  Matches,
  IsDefined,
  Validate,
  ValidateIf,
} from 'class-validator';
import { UserRole, Sub_Plans } from 'src/users/user.entity';
import { Trim } from 'class-sanitizer';
import { PasswordMatchConstraint } from './custom_validators/pw-match';

export class RegisterUserDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Trim() // Trim spaces around the email
  email: string;

  @ValidateIf((a) => !a.googleID)
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]/, {
    message: 'Password must contain at least one letter and one number',
  })
  password: string;

  @ValidateIf((a) => !a.googleID)
  @IsDefined()
  @IsNotEmpty()
  @Validate(PasswordMatchConstraint, ['password'])
  password_confirm: string;

  @IsNotEmpty({ message: 'Name is required' })
  @Trim() // Trim spaces around the name
  name: string;

  @IsOptional() // Role is optional, and a default will be assigned
  @IsEnum(UserRole, { each: true, message: 'Invalid role' })
  role?: UserRole[];

  @IsOptional() // Subscription is optional, defaults to free
  @IsEnum(Sub_Plans, { message: 'Invalid subscription plan' })
  subscription?: Sub_Plans;

  @IsOptional()
  googleID: string;

  @IsOptional()
  profileImage: string;
}
