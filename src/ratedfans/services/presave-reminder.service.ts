import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
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
    private readonly configService: ConfigService,
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
        relations: ['artist', 'presaveSignups', 'links'],
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

      // Get fallback URL
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const fallbackUrl = `${frontendUrl}/r/${page.slug}`;

      for (const signup of presaveSignups) {
        // Find the platform-specific link for this signup
        const platformLink = page.links?.find(
          link => link.platform === signup.platform && link.isActive
        );

        if (!platformLink) {
          this.logger.warn(
            `No active link found for platform ${signup.platform} on page ${page.id}, using fallback URL`
          );
        }

        // Use platform-specific URL or fallback
        const platformUrl = platformLink ? platformLink.url : fallbackUrl;

        await this.sendReminderEmail(page, signup, platformUrl);
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
    platformUrl: string,
  ): Promise<void> {
    try {
      const subject = `🎵 "${page.releaseTitle}" by ${page.artistName} is out now!`;

      // Send email using template with platform-specific URL
      await this.mailerService.sendMail({
        to: signup.email,
        subject,
        template: 'presave-release-reminder',
        context: {
          name: 'Music Fan',
          songTitle: page.releaseTitle,
          artistName: page.artistName || page.artist?.name || 'RatedFans Artist',
          platform: signup.platform,
          platformUrl,
        },
      });

      this.logger.log(
        `Reminder sent to ${signup.email} for "${page.releaseTitle}" on ${signup.platform}`,
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
        relations: ['artist', 'links'],
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

      // Get fallback URL
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const fallbackUrl = `${frontendUrl}/r/${page.slug}`;

      for (const signup of presaveSignups) {
        try {
          // Find the platform-specific link for this signup
          const platformLink = page.links?.find(
            link => link.platform === signup.platform && link.isActive
          );

          if (!platformLink) {
            this.logger.warn(
              `No active link found for platform ${signup.platform} on page ${page.id}, using fallback URL`
            );
          }

          // Use platform-specific URL or fallback
          const platformUrl = platformLink ? platformLink.url : fallbackUrl;

          await this.sendReminderEmail(page, signup, platformUrl);
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
