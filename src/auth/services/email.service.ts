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
}
