import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { MailerService } from '@nestjs-modules/mailer';
import { RatedFansPage } from '../entities/ratedfans-page.entity';
import {
  PresaveSignup,
  PresaveStatus,
} from '../entities/presave-signup.entity';

// 2024-12-28: Added presave reminder job service
@Injectable()
export class PresaveReminderService {
  private readonly logger = new Logger(PresaveReminderService.name);

  constructor(
    @InjectRepository(RatedFansPage)
    private readonly pageRepository: Repository<RatedFansPage>,
    @InjectRepository(PresaveSignup)
    private readonly presaveRepository: Repository<PresaveSignup>,
    private readonly mailerService: MailerService,
  ) {}

  /**
   * Runs daily at 9 AM to check for releases dropping today
   * Sends reminder emails to users who signed up for presave
   */
  @Cron('0 9 * * *') // Daily at 9 AM
  async sendDailyReleaseReminders(): Promise<void> {
    this.logger.log('Starting daily release reminder job...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of day

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1); // End of day

      // Find pages with releases today that have presave enabled
      const pagesReleasingToday = await this.pageRepository.find({
        where: {
          isPresaveEnabled: true,
          releaseDate: Between(today, tomorrow),
        },
        relations: ['artist', 'presaveSignups'],
      });

      this.logger.log(
        `Found ${pagesReleasingToday.length} pages releasing today`,
      );

      for (const page of pagesReleasingToday) {
        await this.sendPageReleaseReminders(page);
      }

      this.logger.log('Daily release reminder job completed');
    } catch (error) {
      this.logger.error('Error in daily release reminder job:', error);
    }
  }

  /**
   * Sends reminder emails for a specific page
   */
  private async sendPageReleaseReminders(page: RatedFansPage): Promise<void> {
    try {
      // Get all confirmed presave signups for this page
      const presaveSignups = await this.presaveRepository.find({
        where: {
          pageId: page.id,
          status: PresaveStatus.CONFIRMED,
        },
      });

      this.logger.log(
        `Sending ${presaveSignups.length} reminder emails for "${page.releaseTitle}"`,
      );

      for (const signup of presaveSignups) {
        await this.sendReminderEmail(page, signup);
      }
    } catch (error) {
      this.logger.error(`Error sending reminders for page ${page.id}:`, error);
    }
  }

  /**
   * Sends a reminder email to a specific user
   */
  private async sendReminderEmail(
    page: RatedFansPage,
    signup: PresaveSignup,
  ): Promise<void> {
    try {
      const subject = `🎵 "${page.releaseTitle}" by ${page.artistName} is out now!`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your pre-saved song is now available! 🎉</h2>
          
          <p>Hi there!</p>
          
          <p>Great news! The song you pre-saved is now live on ${signup.platform}:</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0; color: #555;">"${page.releaseTitle}"</h3>
            <p style="margin: 5px 0; color: #777;">by ${page.artistName}</p>
          </div>
          
          <p>🎵 <strong>Listen now on ${signup.platform}!</strong></p>
          
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Thank you for supporting independent music!<br>
            - The RatedAfrika Team
          </p>
        </div>
      `;

      // Send email using MailerService directly for custom subject and content
      await this.mailerService.sendMail({
        to: signup.email,
        subject,
        html,
      });

      this.logger.log(
        `Reminder sent to ${signup.email} for "${page.releaseTitle}"`,
      );
    } catch (error) {
      this.logger.error(`Failed to send reminder to ${signup.email}:`, error);
    }
  }

  /**
   * Manual method to send reminders for a specific page
   * Can be called from an admin interface or API endpoint
   */
  async sendManualReminder(
    pageId: string,
  ): Promise<{ sent: number; failed: number }> {
    try {
      const page = await this.pageRepository.findOne({
        where: { id: pageId },
        relations: ['artist'],
      });

      if (!page) {
        this.logger.error(`Page ${pageId} not found for manual reminder`);
        return { sent: 0, failed: 0 };
      }

      if (!page.isPresaveEnabled) {
        this.logger.warn(`Presave is not enabled for page ${pageId}`);
        return { sent: 0, failed: 0 };
      }

      const presaveSignups = await this.presaveRepository.find({
        where: {
          pageId: page.id,
          status: PresaveStatus.CONFIRMED,
        },
      });

      let sent = 0;
      let failed = 0;

      for (const signup of presaveSignups) {
        try {
          await this.sendReminderEmail(page, signup);
          sent++;
        } catch (error) {
          failed++;
          this.logger.error(
            `Failed to send reminder to ${signup.email}:`,
            error,
          );
        }
      }

      this.logger.log(
        `Manual reminder completed for "${page.releaseTitle}": ${sent} sent, ${failed} failed`,
      );

      return { sent, failed };
    } catch (error) {
      this.logger.error('Error in manual reminder:', error);
      return { sent: 0, failed: 0 };
    }
  }
}
