import {
  IsString,
  IsOptional,
  IsNumber,
  IsUrl,
  IsNotEmpty,
  IsObject,
  Min,
} from 'class-validator';

export class CreatePromoCardDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsUrl({}, { message: 'Please provide a valid file URL' })
  fileUrl: string;

  @IsNumber()
  @Min(0)
  size: number;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsObject()
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
    originalName?: string;
    description?: string;
    designTemplate?: string;
    colors?: string[];
  };
}

export class PromoCardResponseDto {
  id: string;
  pageId: string;
  fileName: string;
  fileUrl: string;
  size: number;
  mimeType: string | null;
  metadata: {
    width?: number;
    height?: number;
    format?: string;
    originalName?: string;
    description?: string;
    designTemplate?: string;
    colors?: string[];
  } | null;
  createdAt: Date;
}

export class PromoCardUploadDto {
  @IsString()
  @IsNotEmpty()
  imageData: string; // Base64 encoded image from frontend canvas

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  designMetadata?: {
    template?: string;
    colors?: string[];
    fonts?: string[];
    dimensions?: {
      width: number;
      height: number;
    };
  };
}
