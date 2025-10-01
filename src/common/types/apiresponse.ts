import { StreamingPlatform } from '../../ratedfans/entities/ratedfans-link.entity';

export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
}

export interface LinkSuggestion {
  platform: StreamingPlatform;
  url: string | null;
  found: boolean;
  error?: string;
}
