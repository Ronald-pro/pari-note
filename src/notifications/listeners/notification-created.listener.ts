import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationCreatedEvent } from '../events/notification-created.event';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class NotificationCreatedListener {
  private readonly logger = new Logger(NotificationCreatedListener.name);

  constructor(private readonly mailerService: MailerService) {}

  @OnEvent('notification.created')
  async handleNotificationCreated(event: NotificationCreatedEvent) {
    const { notification, parentUsers } = event;

  //   this.logger.log(` Listener received event for notification ${notification.id}`);
  // this.logger.log(` Babies payload: ${JSON.stringify(notification.babies)}`);
  // this.logger.log(` Parent users: ${JSON.stringify(parentUsers)}`);

    const hasStillbirth = notification.babies?.some(
     (b) => b.outcome?.toLowerCase().includes('stillbirth'),
   );

    if (hasStillbirth && parentUsers?.length) {
      for (const user of parentUsers) {
        if (!user.email) continue;

        try {
          const result = await this.mailerService.sendMail({
            to: user.email,
            subject: 'Stillbirth Reported',
            template: './stillbirth-alert',
            context: {
              location: notification.location?.name,
              date: notification.createdAt,
              motherAge: notification.mother?.age,
            },
          });

          this.logger.log(
            `Email sent successfully to ${user.email} (messageId: ${result.messageId})`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to send email to ${user.email}: ${error.message}`,
            error.stack,
          );
        }
      }
    }
  }
}
