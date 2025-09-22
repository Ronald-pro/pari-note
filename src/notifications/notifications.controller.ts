import { Controller, Post, Body, Get, Param, UseGuards, Request, Query, SetMetadata,ParseIntPipe, Req, ForbiddenException } from '@nestjs/common';
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

@UseGuards(JwtAuthGuard)
 @Get('stillbirths/records/:locationId')
async getStillbirthRecords(
  @Req() req,
  @Param('locationId') locationId: number,
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string,
  @Query('page') page = 1,
  @Query('limit') limit = 50,

) {
  return this.notificationsService.getStillbirthRecords(
    Number(locationId),
    startDate,
    endDate,
    Number(page),
    Number(limit),
  );
}

@UseGuards(JwtAuthGuard)
@Roles('admin')
@Get('stillbirths/records/admin')
async getStillbirthRecordsAdmin(
  @Req() req,
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string,
  @Query('page') page = 1,
  @Query('limit') limit = 50,
) {

  return this.notificationsService.getStillbirthRecordsAdmin(
    startDate,
    endDate,
    Number(page),
    Number(limit),
  );
}

}