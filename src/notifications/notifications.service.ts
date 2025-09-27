import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { Baby } from '../babies/entities/baby.entity';
import { Mother } from '../mothers/entities/mother.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Location } from '../locations/entities/location.entity';
import { User } from '../users/entities/user.entity';
import { LocationsService } from '../locations/locations.service';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationCreatedEvent } from './events/notification-created.event';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,

    @InjectRepository(Baby)
    private readonly babiesRepo: Repository<Baby>,

    @InjectRepository(Mother)
    private readonly mothersRepo: Repository<Mother>,

    @InjectRepository(Location)
    private readonly locationsRepo: Repository<Location>,

    private readonly eventEmitter: EventEmitter2,

    private readonly locationsService: LocationsService,
  ) {}

  private async getParentUsers(locationId: number): Promise<User[]> {
  const users: User[] = [];

  let current = await this.locationsRepo.findOne({
    where: { id: locationId },
    relations: ['parent', 'users', 'parent.users'],
  });


  if (current?.users?.length) {
    users.push(...current.users);
  }

  while (current?.parent) {
    if (current.parent.users?.length) {
      users.push(...current.parent.users);
    }

    current = await this.locationsRepo.findOne({
      where: { id: current.parent.id },
      relations: ['parent', 'users', 'parent.users'],
    });
  }

  return Array.from(new Map(users.map(u => [u.id, u])).values());
}


  async createNotification(data: CreateNotificationDto) {
    const location = await this.locationsRepo.findOne({
      where: { id: data.locationId },
      relations: ['parent', 'users', 'parent.users'],
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${data.locationId} not found`);
    }

    const babies = data.babies?.map((b) => this.babiesRepo.create(b)) || [];
    const mother = this.mothersRepo.create(data.mother);

    const notification = this.notificationsRepo.create({
      dateOfNotification: data.dateOfNotification,
      location,
      babies,
      mother,
    });

    const saved = await this.notificationsRepo.save(notification);

    const parentUsers = await this.getParentUsers(location.id);

    this.eventEmitter.emit(
      'notification.created',
      new NotificationCreatedEvent(saved, parentUsers),
    );

    return saved;
  }

  async findAll() {
    return this.notificationsRepo.find({
      relations: ['location', 'babies', 'mother'],
    });
  }

  async findOne(id: number) {
    const notification = await this.notificationsRepo.findOne({
      where: { id },
      relations: ['location', 'babies', 'mother'],
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

async getStillbirthStats(locationId: number, startDate: string, endDate: string) {

  const today = new Date();

  const totalToday = await this.babiesRepo
    .createQueryBuilder('baby')
    .innerJoin('baby.notification', 'notification')
    .innerJoin('notification.location', 'location')
    .where('location.id = :locationId', { locationId })
    .andWhere('LOWER(baby.outcome) LIKE :outcome', { outcome: '%stillbirth%' })
    .andWhere('notification.dateOfNotification = CURDATE()')
    .getCount();

  const sexToday = await this.babiesRepo
    .createQueryBuilder('baby')
    .innerJoin('baby.notification', 'notification')
    .innerJoin('notification.location', 'location')
    .where('location.id = :locationId', { locationId })
    .andWhere('LOWER(baby.outcome) LIKE :outcome', { outcome: '%stillbirth%' })
    .andWhere('notification.dateOfNotification = CURDATE()')
    .select('baby.sex', 'sex')
    .addSelect('COUNT(*)', 'count')
    .groupBy('baby.sex')
    .getRawMany();

  const sexTodayMap: Record<string, number> = {};
  for (const row of sexToday) {
    sexTodayMap[row.sex?.toLowerCase() || 'unknown'] = Number(row.count);
  }

  const typeTodayRows = await this.babiesRepo
    .createQueryBuilder('baby')
    .innerJoin('baby.notification', 'notification')
    .innerJoin('notification.location', 'location')
    .where('location.id = :locationId', { locationId })
    .andWhere('LOWER(baby.outcome) LIKE :outcome', { outcome: '%stillbirth%' })
    .andWhere('notification.dateOfNotification = CURDATE()')
    .select('baby.outcome', 'type')
    .addSelect('COUNT(*)', 'count')
    .groupBy('baby.outcome')
    .getRawMany();

  const typeTodayMap: Record<string, number> = {};
  for (const row of typeTodayRows) {
    typeTodayMap[row.type?.toLowerCase() || 'unknown'] = Number(row.count);
  }

  const placeToday = await this.babiesRepo
    .createQueryBuilder('baby')
    .innerJoin('baby.notification', 'notification')
    .innerJoin('notification.location', 'location')
    .innerJoin('notification.mother', 'mother')
    .where('location.id = :locationId', { locationId })
    .andWhere('LOWER(baby.outcome) LIKE :outcome', { outcome: '%stillbirth%' })
    .andWhere('notification.dateOfNotification = CURDATE()')
    .select('mother.placeOfDelivery', 'place')
    .addSelect('COUNT(*)', 'count')
    .groupBy('mother.placeOfDelivery')
    .getRawMany();

  const placeTodayMap: Record<string, number> = {};
  for (const row of placeToday) {
    placeTodayMap[row.place?.toLowerCase() || 'unknown'] = Number(row.count);
  }

  const monthlyRaw = await this.babiesRepo
    .createQueryBuilder('baby')
    .innerJoin('baby.notification', 'notification')
    .innerJoin('notification.location', 'location')
    .innerJoin('notification.mother', 'mother')
    .where('location.id = :locationId', { locationId })
    .andWhere('LOWER(baby.outcome) LIKE :outcome', { outcome: '%stillbirth%' })
    .andWhere('notification.dateOfNotification >= :startDate', { startDate })
    .andWhere('notification.dateOfNotification <= :endDate', { endDate })
    .select("DATE_FORMAT(notification.dateOfNotification, '%M %Y')", 'month')
    .addSelect('COUNT(*)', 'total')
    .addSelect('AVG(baby.birthWeight)', 'avgWeight')
    .addSelect(
      `SUM(CASE WHEN LOWER(baby.sex) = 'male' THEN 1 ELSE 0 END)`,
      'male'
    )
    .addSelect(
      `SUM(CASE WHEN LOWER(baby.sex) = 'female' THEN 1 ELSE 0 END)`,
      'female'
    )
    .addSelect(
      `SUM(CASE WHEN LOWER(baby.outcome) = 'fresh stillbirth' THEN 1 ELSE 0 END)`,
      'fresh'
    )
    .addSelect(
      `SUM(CASE WHEN LOWER(baby.outcome) = 'macerated stillbirth' THEN 1 ELSE 0 END)`,
      'macerated'
    )
    .addSelect(
      `SUM(CASE WHEN LOWER(mother.placeOfDelivery) = 'facility' THEN 1 ELSE 0 END)`,
      'facility'
    )
    .addSelect(
      `SUM(CASE WHEN LOWER(mother.placeOfDelivery) = 'home' THEN 1 ELSE 0 END)`,
      'home'
    )
    .groupBy("DATE_FORMAT(notification.dateOfNotification, '%M %Y')")
    .orderBy("MIN(notification.dateOfNotification)", 'ASC')
    .getRawMany();

  const monthly = monthlyRaw.map((row) => ({
    month: row.month,
    total: Number(row.total),
    avgWeight: row.avgWeight ? Number(row.avgWeight) : null,
    sex: {
      male: Number(row.male),
      female: Number(row.female),
    },
    type: {
      fresh: Number(row.fresh),
      macerated: Number(row.macerated),
    },
    place: {
      facility: Number(row.facility),
      home: Number(row.home),
    },
  }));

  return {
    today: {
      total: totalToday,
      sex: sexTodayMap,
      type: typeTodayMap,
      place: placeTodayMap,
    },
    monthly,
  };
}

async getStillbirthRecords(
  locationId: number,
  startDate?: string,
  endDate?: string,
  // page = 1,
  // limit = 50,
) {

  const qb = this.notificationsRepo
    .createQueryBuilder('notification')
    .leftJoinAndSelect('notification.babies', 'baby')
    .leftJoinAndSelect('notification.mother', 'mother')
    .leftJoinAndSelect('notification.location', 'location')
    .where('location.id = :locationId', { locationId })
    .andWhere('LOWER(baby.outcome) LIKE :outcome', { outcome: '%stillbirth%' });

  if (startDate) qb.andWhere('notification.dateOfNotification >= :startDate', { startDate });
  if (endDate) qb.andWhere('notification.dateOfNotification <= :endDate', { endDate });

  return qb
    // .skip((page - 1) * limit)
    // .take(limit)
    .getMany();
}

async getStillbirthRecordsAdmin(startDate: string, endDate: string) {
  const query = this.notificationsRepo
    .createQueryBuilder('notification')
    .leftJoinAndSelect('notification.babies', 'baby')
    .leftJoinAndSelect('notification.mother', 'mother')
    .where('LOWER(baby.outcome) LIKE :outcome', { outcome: '%stillbirth%' })
    .andWhere('notification.dateOfNotification >= :startDate', { startDate })
    .andWhere('notification.dateOfNotification <= :endDate', { endDate });

  console.log('Query:', query.getSql());

  return query.getMany();
}


}