import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendNotificationEmail(to: string, context: any) {
    this.logger.log(`📧 Attempting to send email to ${to}`);

    try {
      const result = await this.mailerService.sendMail({
        to,
        subject: 'New Notification',
        template: './stillbirth-alert',
        context, 
      });

      this.logger.log(`✅ Email queued successfully: ${result.messageId || 'no id'}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Email failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
