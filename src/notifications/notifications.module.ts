import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { UserNotification } from './entities/user-notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { UsersModule } from 'src/users/users.module';
import { Baby } from '../babies/entities/baby.entity';
import { Mother } from '../mothers/entities/mother.entity';
import { Location } from '../locations/entities/location.entity';
import { NotificationCreatedListener } from './listeners/notification-created.listener';
import { MailModule } from '../mail/mail.module';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, UserNotification, Baby, Mother, Location]), MailModule, LocationsModule, UsersModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationCreatedListener],
  exports: [NotificationsService],
})
export class NotificationsModule { }
