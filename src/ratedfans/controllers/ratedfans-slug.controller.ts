/* eslint-disable @typescript-eslint/no-unused-vars */
// 2025-01-22 23:45: Created new controller to handle direct /:slug endpoint (not /r/:slug)
// This endpoint returns page details if published, or "not published" message if page exists but unpublished
import {
  Controller,
  Get,
  Param,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ApiResponse } from '../../common/types/apiresponse';
import { RatedFansService } from '../services/ratedfans.service';
import { PublicPageResponseDto } from '../dtos';

@ApiTags('RatedFans Direct Slug Access')
@Controller() // 2025-01-22 23:45: No prefix - creates direct /:slug route at root level
export class RatedFansSlugController {
  constructor(private readonly ratedFansService: RatedFansService) {}

  @Get(':slug')
  @ApiOperation({
    summary: 'Get page details by slug (direct access)',
    description:
      'Returns published page details. If page exists but is not published, returns 403 Forbidden.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Unique slug identifier for the RatedFans page',
    example: 'artist-song-title',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Published page details retrieved successfully',
  })
  @SwaggerApiResponse({
    status: 403,
    description: 'Page exists but is not published',
  })
  @SwaggerApiResponse({
    status: 404,
    description: 'Page not found',
  })
  async getPageBySlug(
    @Param('slug') slug: string,
  ): Promise<ApiResponse<PublicPageResponseDto>> {
    // 2025-01-22 23:45: Call new service method that handles both published and unpublished pages
    return await this.ratedFansService.findPageBySlugDirect(slug);
  }
}
