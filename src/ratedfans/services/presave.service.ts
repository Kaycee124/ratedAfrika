// import { Injectable, Logger, HttpStatus } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { ConfigService } from '@nestjs/config';
// import {
//   PresaveSignup,
//   PresaveStatus,
// } from '../entities/presave-signup.entity';
// import { RatedFansPage } from '../entities/ratedfans-page.entity';
// import { StreamingPlatform } from '../entities/ratedfans-link.entity';
// import { ApiResponse } from '../../common/types/apiresponse';
// import { EmailService } from '../../auth/services/email.service';

// @Injectable()
// export class PresaveService {
//   private readonly logger = new Logger(PresaveService.name);

//   constructor(
//     @InjectRepository(PresaveSignup)
//     private readonly presaveRepository: Repository<PresaveSignup>,
//     @InjectRepository(RatedFansPage)
//     private readonly pageRepository: Repository<RatedFansPage>,
//     private readonly emailService: EmailService,
//     private readonly configService: ConfigService,
//   ) {}

//   /**
//    * Handle presave signup from public page by slug (public endpoint)
//    *
//    * Process:
//    * 1. Find page by slug and verify presave is enabled
//    * 2. Check for duplicate signups
//    * 3. Create presave signup record
//    * 4. Send confirmation email (TODO)
//    */
//   async signupForPresaveBySlug(
//     slug: string,
//     presaveDto: any, // PresaveSignupDto from DTOs
//   ): Promise<ApiResponse> {
//     try {
//       // Find page by slug and verify presave is enabled
//       const page = await this.pageRepository.findOne({
//         where: { slug, isPublished: true, isPresaveEnabled: true },
//       });

//       if (!page) {
//         return {
//           statusCode: HttpStatus.NOT_FOUND,
//           message: 'Page not found or presave not enabled',
//         };
//       }

//       // Use the existing signupForPresave method
//       return this.signupForPresave(
//         page.id,
//         presaveDto.email,
//         presaveDto.platform,
//         presaveDto.metadata,
//       );
//     } catch (error) {
//       this.logger.error(`Error in presave signup by slug: ${error.message}`);
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'Failed to sign up for presave',
//       };
//     }
//   }

//   /**
//    * Handle presave signup from public page by pageId (internal method)
//    */
//   async signupForPresave(
//     pageId: string,
//     email: string,
//     platform: StreamingPlatform,
//     metadata?: any,
//   ): Promise<ApiResponse> {
//     try {
//       // Check if page exists and presave is enabled, load artist relation
//       const page = await this.pageRepository.findOne({
//         where: { id: pageId, isPresaveEnabled: true },
//         relations: ['artist'],
//       });

//       if (!page) {
//         return {
//           statusCode: HttpStatus.NOT_FOUND,
//           message: 'Page not found or presave not enabled',
//         };
//       }

//       // Check if already signed up
//       const existingSignup = await this.presaveRepository.findOne({
//         where: { pageId, email, platform },
//       });

//       if (existingSignup) {
//         return {
//           statusCode: HttpStatus.CONFLICT,
//           message: 'Already signed up for presave on this platform',
//         };
//       }

//       // Create presave signup
//       const signup = this.presaveRepository.create({
//         pageId,
//         email,
//         platform,
//         status: PresaveStatus.PENDING,
//         confirmationToken: this.generateConfirmationToken(),
//         metadata,
//       });

//       await this.presaveRepository.save(signup);

//       // Send confirmation email (non-blocking - don't fail signup if email fails)
//       try {
//         const frontendUrl = this.configService.get<string>('FRONTEND_URL');

//         if (!frontendUrl) {
//           this.logger.warn(
//             'FRONTEND_URL not configured, skipping confirmation email',
//           );
//         } else {
//           const confirmationLink = `${frontendUrl}/presave/confirm?token=${signup.confirmationToken}`;
//           const artistName =
//             page.artist?.name || page.artistName || 'RatedFans Artist';
//           const songTitle = page.releaseTitle || 'Your Release';

//           await this.emailService.sendPresaveConfirmation(
//             email,
//             'Music Fan', // Placeholder name since we don't collect it during presave
//             confirmationLink,
//             songTitle,
//             artistName,
//           );
//         }
//       } catch (emailError) {
//         // Log error but don't fail the signup
//         this.logger.error(
//           `Failed to send confirmation email for presave ${signup.id}: ${emailError.message}`,
//         );
//       }

//       return {
//         statusCode: HttpStatus.CREATED,
//         message: 'Successfully signed up. Please check your email to confirm.',
//         data: { id: signup.id },
//       };
//     } catch (error) {
//       this.logger.error(`Error creating presave signup: ${error.message}`);
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'Failed to sign up for presave',
//       };
//     }
//   }

//   /**
//    * Confirm presave signup via email token
//    */
//   async confirmPresave(token: string): Promise<ApiResponse> {
//     try {
//       const signup = await this.presaveRepository.findOne({
//         where: { confirmationToken: token, status: PresaveStatus.PENDING },
//       });

//       if (!signup) {
//         return {
//           statusCode: HttpStatus.NOT_FOUND,
//           message: 'Invalid or expired confirmation token',
//         };
//       }

//       signup.status = PresaveStatus.CONFIRMED;
//       signup.confirmedAt = new Date();
//       await this.presaveRepository.save(signup);

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Presave confirmed successfully',
//       };
//     } catch (error) {
//       this.logger.error(`Error confirming presave: ${error.message}`);
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'Failed to confirm presave',
//       };
//     }
//   }

//   /**
//    * Get presave statistics for a page
//    */
//   async getPresaveStats(pageId: string): Promise<ApiResponse> {
//     try {
//       const stats = await this.presaveRepository
//         .createQueryBuilder('presave')
//         .select(['presave.platform', 'presave.status', 'COUNT(*) as count'])
//         .where('presave.pageId = :pageId', { pageId })
//         .groupBy('presave.platform, presave.status')
//         .getRawMany();

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Presave statistics retrieved',
//         data: stats,
//       };
//     } catch (error) {
//       this.logger.error(`Error getting presave stats: ${error.message}`);
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'Failed to get presave statistics',
//       };
//     }
//   }

//   private generateConfirmationToken(): string {
//     return (
//       Math.random().toString(36).substring(2, 15) +
//       Math.random().toString(36).substring(2, 15)
//     );
//   }
// }

// src/ratedfans/services/presave.service.ts

// src/ratedfans/services/presave.service.ts

import { Injectable, Logger, HttpStatus, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  PresaveSignup,
  PresaveStatus,
} from '../entities/presave-signup.entity';
import { RatedFansPage } from '../entities/ratedfans-page.entity';
import { StreamingPlatform } from '../entities/ratedfans-link.entity';
import { ApiResponse } from '../../common/types/apiresponse';
import { EmailService } from '../../auth/services/email.service';

// 24 hours
const TOKEN_VALIDITY_DURATION_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PresaveService {
  private readonly logger = new Logger(PresaveService.name);

  constructor(
    @InjectRepository(PresaveSignup)
    private readonly presaveRepository: Repository<PresaveSignup>,
    @InjectRepository(RatedFansPage)
    private readonly pageRepository: Repository<RatedFansPage>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async signupForPresaveBySlug(
    slug: string,
    presaveDto: any,
  ): Promise<ApiResponse> {
    try {
      // Find page by slug and verify presave is enabled
      const page = await this.pageRepository.findOne({
        where: { slug, isPublished: true, isPresaveEnabled: true },
      });

      if (!page) {
        // Log the specific error before returning
        this.logger.warn(
          `Presave signup attempt failed: Page not found or presave not enabled for page with slug '${slug}'`,
        );
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
      // Log the error with context
      this.logger.error(
        `Error in presave signup by slug '${slug}': ${error.message}`,
        error.stack,
      );
      // Propagate HttpException if it's already one
      if (error instanceof HttpException) {
        throw error;
      }
      // Return a generic error for unexpected issues
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to sign up for presave due to an internal error.',
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
    let signup: PresaveSignup | null = null;
    let infoMessage: string | null = null; // To store informational messages

    try {
      // Check if page exists and presave is enabled, load artist relation
      const page = await this.pageRepository.findOne({
        where: { id: pageId, isPresaveEnabled: true },
        relations: ['artist'],
      });

      if (!page) {
        this.logger.warn(
          `Presave signup attempt failed: Page not found or presave not enabled for pageId '${pageId}'`,
        );
        throw new HttpException(
          'Page not found or presave not enabled',
          HttpStatus.NOT_FOUND,
        );
      }

      // Check if already signed up
      const existingSignup = await this.presaveRepository.findOne({
        where: { pageId, email, platform },
      });

      if (existingSignup) {
        // --- Logic for existing signups ---
        if (existingSignup.status === PresaveStatus.CONFIRMED) {
          this.logger.log(
            `Presave signup attempt conflict: Email '${email}' already confirmed for pageId '${pageId}' on platform '${platform}'.`,
          );
          throw new HttpException(
            'Already signed up and confirmed for presave on this platform',
            HttpStatus.CONFLICT,
          );
        } else if (existingSignup.status === PresaveStatus.PENDING) {
          const expirationTime = new Date(
            Date.now() - TOKEN_VALIDITY_DURATION_MS,
          );
          // Check if the existing PENDING signup's token is expired
          if (existingSignup.createdAt <= expirationTime) {
            // **Expired Pending Signup: Regenerate token & reset timer**
            this.logger.log(
              `Existing PENDING signup found but expired for ${email} on page ${pageId}. Regenerating token.`,
            );
            existingSignup.confirmationToken = this.generateConfirmationToken();
            existingSignup.createdAt = new Date(); // Reset timer for new token
            await this.presaveRepository.save(existingSignup);
            signup = existingSignup; // Use this updated record
            infoMessage =
              "Your previous confirmation link expired. We've sent a new one."; // Informative message
          } else {
            // **Valid Pending Signup: Resend email with EXISTING token**
            this.logger.log(
              `Existing valid PENDING signup found for ${email} on page ${pageId}. Resending confirmation email.`,
            );
            signup = existingSignup; // Use the existing record
            infoMessage =
              'You already have a pending signup. We have resent the confirmation email.'; // Informative message
          }
        }
        // Handle other statuses like CANCELLED if needed, otherwise ignore and create new.
      }

      // If no existing signup OR if existing was expired/cancelled, create a new one
      if (!signup) {
        this.logger.log(
          `Creating new PENDING signup for ${email} on page ${pageId}.`,
        );
        signup = this.presaveRepository.create({
          pageId,
          email,
          platform,
          status: PresaveStatus.PENDING,
          confirmationToken: this.generateConfirmationToken(),
          metadata,
          // createdAt will be set automatically
        });
        await this.presaveRepository.save(signup);
      }

      // --- Email Sending ---
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      if (!frontendUrl) {
        this.logger.error(
          'CRITICAL: FRONTEND_URL not configured. Cannot send confirmation email.',
        );
        throw new HttpException(
          'Server configuration error, cannot send confirmation email.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const confirmationLink = `${frontendUrl}/presave/confirm?token=${signup.confirmationToken}`;
      const artistName =
        page.artist?.name || page.artistName || 'RatedFans Artist';
      const songTitle = page.releaseTitle || 'Fan Release';
      let userName = 'Music Fan'; // Default fallback name
      const emailParts = email.split('@');
      if (emailParts[0] && emailParts[0].length > 0) {
        userName = emailParts[0]; // Use the part before '@'
        // Capitalize the first letter
        userName = userName.charAt(0).toUpperCase() + userName.slice(1);
      }
      this.logger.debug(
        `Using extracted name '${userName}' for email to ${email}`,
      ); // Added logging

      try {
        await this.emailService.sendPresaveConfirmation(
          email,
          userName, // Placeholder name
          confirmationLink,
          songTitle,
          artistName,
        );
        this.logger.log(
          `Presave confirmation email successfully sent to ${email} for page ${pageId}. Token: ${signup.confirmationToken}`,
        );
      } catch (emailError) {
        // Log the specific email sending error
        this.logger.error(
          `Failed to send presave confirmation email to ${email} for page ${pageId}: ${emailError.message}`,
          emailError.stack,
        );
        // Throw an error so the user knows something went wrong
        throw new HttpException(
          'We could not send the confirmation email. Please try again later or contact support.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Return success response (CREATED for new, OK if resent)
      const finalStatusCode = infoMessage ? HttpStatus.OK : HttpStatus.CREATED;
      const finalMessage =
        infoMessage ||
        'Successfully signed up. Please check your email to confirm.';

      return {
        statusCode: finalStatusCode,
        message: finalMessage,
        data: { id: signup.id },
      };
    } catch (error) {
      // Log errors that weren't caught and logged before throwing HttpException
      if (!(error instanceof HttpException)) {
        this.logger.error(
          `Unexpected error during presave signup for page ${pageId}, email ${email}: ${error.message}`,
          error.stack,
        );
      }

      // Re-throw HttpExceptions (like CONFLICT, NOT_FOUND, or the explicit ones above)
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle other unexpected errors (like DB errors)
      throw new HttpException(
        'Failed to complete signup process due to an internal error. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Confirm presave signup via email token
   */
  async confirmPresave(token: string): Promise<ApiResponse> {
    try {
      // Calculate the expiration time
      const expirationTime = new Date(Date.now() - TOKEN_VALIDITY_DURATION_MS);
      this.logger.log(
        `Confirming presave token '${token}'. Expiration threshold: ${expirationTime.toISOString()}`,
      );

      const signup = await this.presaveRepository.findOne({
        where: {
          confirmationToken: token,
          status: PresaveStatus.PENDING,
          createdAt: MoreThan(expirationTime),
        },
      });

      // If signup is not found OR it's expired
      if (!signup) {
        this.logger.warn(
          `Presave confirmation failed: Token '${token}' not found, expired, or not pending.`,
        );
        // Check specific reason for better logging/response
        const existingSignup = await this.presaveRepository.findOne({
          where: { confirmationToken: token },
        });
        if (existingSignup && existingSignup.status !== PresaveStatus.PENDING) {
          this.logger.warn(
            `Token '${token}' already used (Status: ${existingSignup.status}).`,
          );
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'This presave link has already been used.',
          };
        }
        if (existingSignup && existingSignup.createdAt <= expirationTime) {
          this.logger.warn(
            `Token '${token}' is expired (Created: ${existingSignup.createdAt.toISOString()}).`,
          );
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'This presave confirmation link has expired.',
          };
        }
        // Otherwise, the token is genuinely invalid
        this.logger.warn(`Token '${token}' is invalid.`);
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Invalid or expired confirmation token',
        };
      }

      // Token is valid and pending
      signup.status = PresaveStatus.CONFIRMED;
      signup.confirmedAt = new Date();
      // signup.confirmationToken = null; // Optional: Nullify after use
      await this.presaveRepository.save(signup);
      this.logger.log(
        `Presave successfully confirmed for signup ID '${signup.id}' using token '${token}'.`,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Presave confirmed successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error during confirmPresave for token '${token}': ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to confirm presave due to an internal error.',
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
      this.logger.log(
        `Retrieved presave stats for pageId '${pageId}'. Found ${stats.length} stat groups.`,
      );
      return {
        statusCode: HttpStatus.OK,
        message: 'Presave statistics retrieved',
        data: stats,
      };
    } catch (error) {
      this.logger.error(
        `Error getting presave stats for pageId '${pageId}': ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to get presave statistics due to an internal error.',
      };
    }
  }

  private generateConfirmationToken(): string {
    // Still using Math.random here as per previous code, consider crypto.randomBytes
    const token =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    this.logger.debug(`Generated confirmation token: ${token}`); // Log token generation
    return token;
  }
}
