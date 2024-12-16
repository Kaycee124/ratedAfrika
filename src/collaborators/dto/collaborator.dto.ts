// src/collaborators/dto/create-collaborator.dto.ts
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CollaboratorType } from '../interfaces/collaborator-type.enum';
import { PaymentInfoDto } from './paymentinfo.dto';

export class CreateCollaboratorDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(CollaboratorType)
  type: CollaboratorType;

  @IsOptional()
  @IsString()
  artistId?: string;

  @IsString()
  taxId: string;

  @ValidateNested()
  @Type(() => PaymentInfoDto)
  paymentInfo: PaymentInfoDto;
}
// src/collaborators/dto/create-split.dto.ts
import { SplitType } from '../types/collaborator-types';

export class CreateSplitDto {
  @IsUUID()
  @IsNotEmpty()
  collaboratorId: string;

  @IsUUID()
  @IsNotEmpty()
  songId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @IsEnum(SplitType)
  @IsNotEmpty()
  splitType: SplitType;
}
// src/collaborators/dto/update-collaborator.dto.ts
import { PartialType } from '@nestjs/mapped-types';

export class UpdateCollaboratorDto extends PartialType(CreateCollaboratorDto) {}
