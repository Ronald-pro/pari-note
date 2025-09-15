import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { LocationsService } from 'src/locations/locations.service';

import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private usersRepo: Repository<User>,
        private readonly locationsService: LocationsService,
    ) { }

    async create(userDto: any) {
  const { roleId, locationId, password, ...rest } = userDto;
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = this.usersRepo.create({
    ...rest,
    password: hashedPassword,
    role: roleId ? { id: roleId } as any : undefined,
    location: locationId ? { id: locationId } as any : undefined,
   });

    return this.usersRepo.save(newUser);
   }

    findByEmail(email: string) {
        return this.usersRepo.findOne({ where: { email } });
    }

    findById(id: number) {
        return this.usersRepo.findOne({ where: { id }, relations: ['location', 'location.parent', 'location.parent.parent', 'role',] });
    }

    findByLocation(locationId: number) {
        return this.usersRepo.find({
            where: { location: { id: locationId } },
            relations: ['location'],
        });
    }

    findAll() {
        return this.usersRepo.find({
            relations: ['location'],
        });
    }

    async findUsersInLocation(userId: number): Promise<User[]> {
        const user = await this.usersRepo.findOne({
            where: { id: userId },
            relations: ['location'],
        });

        if (!user) {
          throw new NotFoundException('User not found');
       }

       if (user.role?.name.toLowerCase() === 'admin') {
        return this.usersRepo.find({
         relations: ['role', 'location'],
        });
       }

       if (!user.location) {
        throw new NotFoundException('User location not set');
       }
        const accessibleLocationIds = await this.locationsService.getAccessibleLocationIds(user.location.id);

        return this.usersRepo.find({
            where: { location: { id: In(accessibleLocationIds) } },
            relations: ['role', 'location'],
        });
    }
}

