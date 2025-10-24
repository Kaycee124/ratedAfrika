import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendPasswordResetEmail(
    email: string,
    resetCode: string,
    name: string,
  ): Promise<void> {
    // const resetUrl = `${this.configService.get<string>('FRONTEND_URL')}/reset-password`;

    try {
      this.logger.log(`Sending reset code: ${resetCode} to ${email}`);
      await this.mailerService.sendMail({
        to: email,
        subject: 'Password Reset Request',
        template: 'password-reset', // Ensure this template exists
        context: {
          name, // Pass the user's name
          resetCode, // Pass the reset code
          // resetUrl,  // Pass the reset URL for reference
        },
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to send password reset email.',
      );
    }
  }

  async sendEmailVerification(
    email: string,
    verificationToken: string,
    name: string,
  ): Promise<void> {
    const code = verificationToken;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify Your Email Address',
        template: 'email-verification', // Ensure this template exists
        context: {
          name,
          code,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send email verification to ${email}`,
        error.stack,
      ); // Log error details
      throw new InternalServerErrorException(
        'Failed to send email verification email.',
      );
    }
  }

  async sendOtpEmail(email: string, name: string, otp: string): Promise<void> {
    const Otp = otp;
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: "someone's trying to get in",
        template: 'otp', // Ensure this template exists
        context: {
          name,
          Otp,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send email verification to ${email}`,
        error.stack,
      ); // Log error details
      throw new InternalServerErrorException('Failed to send otp.');
    }
  }
  // send updateotp email method
  async sendUpdateOtpEmail(
    email: string,
    name: string,
    otp: string,
    updateType: string,
  ): Promise<void> {
    const Otp = otp;
    const formattedUpdateType =
      updateType.charAt(0).toUpperCase() + updateType.slice(1).toLowerCase();

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: `Verify Your ${formattedUpdateType} Update - RatedaFRiKa`,
        template: 'update-otp',
        context: {
          name,
          Otp,
          updateType: formattedUpdateType,
          expiryTime: '10 minutes',
          supportEmail: 'support@ratedafrika.com',
        },
      });

      this.logger.log(
        `Update OTP email sent successfully to ${email} for ${updateType} update`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send update verification OTP to ${email} for ${updateType} update`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to send verification code for ${updateType} update. Please try again later.`,
      );
    }
  }
  //send notifications to user about split
  async sendSplitNotification(
    email: string,
    claimLink: string,
    recipientName: string,
    extraDetails: { songTitle: string; percentage: number; claimToken: string }, // Updated to accept an object
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'You were added to a split',
        template: 'split-notification',
        context: {
          claimLink,
          recipientName,
          ...extraDetails, // Spread extraDetails into the context
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send split notification to ${email}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to send split notification email.',
      );
    }
  }

  // Send notification when a user is removed from a split sheet
  async sendSplitRemovalNotification(
    email: string,
    recipientName: string,
    songTitle: string,
    oldPercentage: number,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Split Sheet Entry Removed',
        template: 'split-removal-notification',
        context: {
          recipientName,
          songTitle,
          oldPercentage,
        },
      });

      this.logger.log(
        `Split removal notification sent successfully to ${email} for song "${songTitle}"`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send split removal notification to ${email}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to send split removal notification email.',
      );
    }
  }

  // Send notification when a split sheet entry is updated
  async sendSplitUpdateNotification(
    email: string,
    recipientName: string,
    songTitle: string,
    oldPercentage: number,
    newPercentage: number,
    claimLink: string,
    claimToken: string,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Split Sheet Entry Updated',
        template: 'split-update-notification',
        context: {
          recipientName,
          songTitle,
          oldPercentage,
          newPercentage,
          claimLink,
          claimToken,
        },
      });

      this.logger.log(
        `Split update notification sent successfully to ${email} for song "${songTitle}"`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send split update notification to ${email}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to send split update notification email.',
      );
    }
  }

  // Send presave confirmation email
  async sendPresaveConfirmation(
    email: string,
    name: string,
    confirmationLink: string,
    songTitle: string,
    artistName: string,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: `Confirm Your Presave for ${songTitle}!`,
        template: 'presave-confirmation',
        context: {
          name,
          confirmationLink,
          songTitle,
          artistName,
        },
      });

      this.logger.log(
        `Presave confirmation email sent to ${email} for "${songTitle}"`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send presave confirmation email to ${email} for "${songTitle}"`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to send presave confirmation email.',
      );
    }
  }
}
