import { IsEmail, IsString, IsDefined } from 'class-validator';

export class VerifyOtpDto {
  @IsDefined()
  @IsEmail()
  email: string;

  @IsDefined()
  @IsString()
  otp: string;
}
