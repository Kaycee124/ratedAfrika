import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PresaveSignup,
  PresaveStatus,
} from '../entities/presave-signup.entity';
import { RatedFansPage } from '../entities/ratedfans-page.entity';
import { StreamingPlatform } from '../entities/ratedfans-link.entity';
import { ApiResponse } from '../../common/types/apiresponse';

@Injectable()
export class PresaveService {
  private readonly logger = new Logger(PresaveService.name);

  constructor(
    @InjectRepository(PresaveSignup)
    private readonly presaveRepository: Repository<PresaveSignup>,
    @InjectRepository(RatedFansPage)
    private readonly pageRepository: Repository<RatedFansPage>,
  ) {}

  /**
   * Handle presave signup from public page by slug (public endpoint)
   *
   * Process:
   * 1. Find page by slug and verify presave is enabled
   * 2. Check for duplicate signups
   * 3. Create presave signup record
   * 4. Send confirmation email (TODO)
   */
  async signupForPresaveBySlug(
    slug: string,
    presaveDto: any, // PresaveSignupDto from DTOs
  ): Promise<ApiResponse> {
    try {
      // Find page by slug and verify presave is enabled
      const page = await this.pageRepository.findOne({
        where: { slug, isPublished: true, isPresaveEnabled: true },
      });

      if (!page) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Page not found or presave not enabled',
        };
      }

      // Use the existing signupForPresave method
      return this.signupForPresave(
        page.id,
        presaveDto.email,
        presaveDto.platform,
        presaveDto.metadata,
      );
    } catch (error) {
      this.logger.error(`Error in presave signup by slug: ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to sign up for presave',
      };
    }
  }

  /**
   * Handle presave signup from public page by pageId (internal method)
   */
  async signupForPresave(
    pageId: string,
    email: string,
    platform: StreamingPlatform,
    metadata?: any,
  ): Promise<ApiResponse> {
    try {
      // Check if page exists and presave is enabled
      const page = await this.pageRepository.findOne({
        where: { id: pageId, isPresaveEnabled: true },
      });

      if (!page) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Page not found or presave not enabled',
        };
      }

      // Check if already signed up
      const existingSignup = await this.presaveRepository.findOne({
        where: { pageId, email, platform },
      });

      if (existingSignup) {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Already signed up for presave on this platform',
        };
      }

      // Create presave signup
      const signup = this.presaveRepository.create({
        pageId,
        email,
        platform,
        status: PresaveStatus.PENDING,
        confirmationToken: this.generateConfirmationToken(),
        metadata,
      });

      await this.presaveRepository.save(signup);

      // TODO: Send confirmation email

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Successfully signed up for presave',
        data: { id: signup.id },
      };
    } catch (error) {
      this.logger.error(`Error creating presave signup: ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to sign up for presave',
      };
    }
  }

  /**
   * Confirm presave signup via email token
   */
  async confirmPresave(token: string): Promise<ApiResponse> {
    try {
      const signup = await this.presaveRepository.findOne({
        where: { confirmationToken: token, status: PresaveStatus.PENDING },
      });

      if (!signup) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Invalid or expired confirmation token',
        };
      }

      signup.status = PresaveStatus.CONFIRMED;
      signup.confirmedAt = new Date();
      await this.presaveRepository.save(signup);

      return {
        statusCode: HttpStatus.OK,
        message: 'Presave confirmed successfully',
      };
    } catch (error) {
      this.logger.error(`Error confirming presave: ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to confirm presave',
      };
    }
  }

  /**
   * Get presave statistics for a page
   */
  async getPresaveStats(pageId: string): Promise<ApiResponse> {
    try {
      const stats = await this.presaveRepository
        .createQueryBuilder('presave')
        .select(['presave.platform', 'presave.status', 'COUNT(*) as count'])
        .where('presave.pageId = :pageId', { pageId })
        .groupBy('presave.platform, presave.status')
        .getRawMany();

      return {
        statusCode: HttpStatus.OK,
        message: 'Presave statistics retrieved',
        data: stats,
      };
    } catch (error) {
      this.logger.error(`Error getting presave stats: ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to get presave statistics',
      };
    }
  }

  private generateConfirmationToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
