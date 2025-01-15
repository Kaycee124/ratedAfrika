import { IsString } from 'class-validator';

export class Disable2FADto {
  @IsString()
  twoFactorCode: string;
}
