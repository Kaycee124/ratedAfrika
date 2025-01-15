import { IsDefined, IsEmail, IsNotEmpty } from 'class-validator';
import { Trim } from 'class-sanitizer';

export class LoginUserDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Trim() // Trim spaces around the email
  @IsDefined()
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsDefined()
  password: string;
}
