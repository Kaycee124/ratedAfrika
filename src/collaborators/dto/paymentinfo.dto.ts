// src/collaborators/dto/payment-info.dto.ts
import {
  IsString,
  IsEnum,
  IsOptional,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BankAccountInfoDto {
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  bankName: string;

  @IsString()
  @IsNotEmpty()
  swiftCode: string;

  @IsString()
  @IsOptional()
  routingNumber?: string;

  @IsString()
  @IsOptional()
  iban?: string;
}

export class PaypalInfoDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  accountId?: string;
}

export class CryptoWalletInfoDto {
  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @IsEnum(['ETH', 'BTC', 'USDT'])
  network: 'ETH' | 'BTC' | 'USDT';
}

export class PaymentInfoDto {
  @IsEnum(['bankAccount', 'paypal', 'crypto'])
  preferredMethod: 'bankAccount' | 'paypal' | 'crypto';

  @ValidateNested()
  @Type(() => BankAccountInfoDto)
  @IsOptional()
  bankAccount?: BankAccountInfoDto;

  @ValidateNested()
  @Type(() => PaypalInfoDto)
  @IsOptional()
  paypal?: PaypalInfoDto;

  @ValidateNested()
  @Type(() => CryptoWalletInfoDto)
  @IsOptional()
  cryptoWallet?: CryptoWalletInfoDto;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  taxResidenceCountry: string;
}
