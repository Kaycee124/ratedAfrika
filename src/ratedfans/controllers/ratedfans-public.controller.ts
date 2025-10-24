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
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiResponse } from '../../common/types/apiresponse';
import { RatedFansService } from '../services/ratedfans.service';
import { PresaveService } from '../services/presave.service';
import { PresaveSignupDto, RedirectQueryDto } from '../dtos';
import { Throttle } from '@nestjs/throttler';

@ApiTags('RatedFans Public')
@Controller('r') // This gives us /r/{slug} URLs
export class RatedFansPublicController {
  constructor(
    private readonly ratedFansService: RatedFansService,
    private readonly presaveService: PresaveService,
    private readonly configService: ConfigService,
  ) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Get page details by slug' })
  async getPageBySlug(@Param('slug') slug: string): Promise<ApiResponse> {
    return await this.ratedFansService.findPageBySlug(slug);
  }

  @Get(':slug/links')
  @ApiOperation({ summary: 'Get active streaming platform links' })
  async getPageLinks(@Param('slug') slug: string): Promise<ApiResponse> {
    return await this.ratedFansService.getPageLinks(slug);
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
  @Throttle({ default: { limit: 5, ttl: 60000 } }) //5 signups per minute per IP
  async signupForPresave(
    @Param('slug') slug: string,
    @Body() presaveDto: PresaveSignupDto,
  ): Promise<ApiResponse> {
    return await this.presaveService.signupForPresaveBySlug(slug, presaveDto);
  }

  @Get('presave/confirm')
  @ApiOperation({ summary: 'Confirm presave signup via token' })
  async confirmPresave(
    @Query('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');

      if (!frontendUrl) {
        // Fallback if FRONTEND_URL is not configured
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .send('Configuration error: FRONTEND_URL not set');
        return;
      }

      // Call the presave service to confirm
      const result = await this.presaveService.confirmPresave(token);

      // Redirect based on result
      if (result.statusCode === HttpStatus.OK) {
        // Success - redirect to success page
        res.redirect(`${frontendUrl}/presave/confirmed`);
      } else {
        // Failure - redirect to error page with message
        const errorMessage = encodeURIComponent(
          result.message || 'Confirmation failed',
        );
        res.redirect(`${frontendUrl}/presave/error?message=${errorMessage}`);
      }
    } catch (error) {
      // Unexpected error - redirect to generic error page
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3000';
      res.redirect(`${frontendUrl}/presave/error`);
    }
  }
}
