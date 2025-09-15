import { Controller, Post, Body, Get, Param, UseGuards, SetMetadata } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  //@SetMetadata('permission', 'notification:create')
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'nurse')
  @Post()
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.createNotification(createNotificationDto);
  }

  //@SetMetadata('permission', 'notification:read')
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'nurse')
  @Get()
  async findAll() {
    return this.notificationsService.findAll();
  }

// @SetMetadata('permission', 'notification:read')
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'nurse')
  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.notificationsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stillbirths/:locationId')
  async getStillbirthStats(@Param('locationId') locationId: number) {
    return this.notificationsService.getStillbirthStats(Number(locationId));
  }
}