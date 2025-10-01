import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreatePageDto } from './create-page.dto';

export class UpdatePageDto extends PartialType(CreatePageDto) {}

export class PublishPageDto {
  @IsBoolean()
  isPublished: boolean;
}

export class TogglePresaveDto {
  @IsBoolean()
  isPresaveEnabled: boolean;

  @IsOptional()
  @IsBoolean()
  requiresReleaseDateUpdate?: boolean;
}
