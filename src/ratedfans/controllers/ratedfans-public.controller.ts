/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Res,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ApiResponse } from '../../common/types/apiresponse';
import { RatedFansService } from '../services/ratedfans.service';
import { PresaveService } from '../services/presave.service';
import { PresaveSignupDto, RedirectQueryDto } from '../dtos';

@ApiTags('RatedFans Public')
@Controller('r') // This gives us /r/{slug} URLs
export class RatedFansPublicController {
  constructor(
    private readonly ratedFansService: RatedFansService,
    private readonly presaveService: PresaveService,
  ) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Get page details by slug' })
  async getPageBySlug(@Param('slug') slug: string): Promise<ApiResponse> {
    return this.ratedFansService.findPageBySlug(slug);
  }

  @Get(':slug/links')
  @ApiOperation({ summary: 'Get active streaming platform links' })
  async getPageLinks(@Param('slug') slug: string): Promise<ApiResponse> {
    return this.ratedFansService.getPageLinks(slug);
  }

  @Get(':slug/redirect')
  @ApiOperation({ summary: 'Redirect to platform with click tracking' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async redirectToPlatform(
    @Param('slug') slug: string,
    @Query() query: RedirectQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    return this.ratedFansService.redirectToPlatform(slug, query, res);
  }

  @Post(':slug/presave')
  @ApiOperation({ summary: 'Sign up for presave campaign' })
  @UsePipes(new ValidationPipe())
  async signupForPresave(
    @Param('slug') slug: string,
    @Body() presaveDto: PresaveSignupDto,
  ): Promise<ApiResponse> {
    return this.presaveService.signupForPresaveBySlug(slug, presaveDto);
  }
}
