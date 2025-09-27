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
  const { roleIds, locationId, password, ...rest } = userDto;
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = this.usersRepo.create({
    ...rest,
    password: hashedPassword,
    roles: roleIds?.map((id: number) => ({ id })) || [],
    location: locationId ? { id: locationId } as any : undefined,
  });

  return this.usersRepo.save(newUser);
}


    findByEmail(email: string) {
        return this.usersRepo.findOne({ where: { email } });
    }

    findById(id: number) {
        return this.usersRepo.findOne({ where: { id }, relations: ['location', 'location.parent', 'location.parent.parent', 'roles'],
 });
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
            relations: ['location', 'roles'],
        });

        if (!user) {
          throw new NotFoundException('User not found');
       }

       const isAdmin = user.roles?.some(
        (role) => role.name.toLowerCase() === 'admin',
       );

        if (isAdmin) {
         return this.usersRepo.find({
         relations: ['roles', 'location'],
       });
       }

       if (!user.location) {
        throw new NotFoundException('User location not set');
       }
        const accessibleLocationIds = await this.locationsService.getAccessibleLocationIds(user.location.id);

        return this.usersRepo.find({
            where: { location: { id: In(accessibleLocationIds) } },
            relations: ['roles', 'location'],
        });
    }

    async updateUser(id: number, userDto: any): Promise<User> {
       const user = await this.usersRepo.findOne({ where: { id }, relations: ['roles', 'location'] });

       if (!user) {
         throw new NotFoundException(`User with ID ${id} not found`);
       }

       if (userDto.password) {
         userDto.password = await bcrypt.hash(userDto.password, 10);
       }

       if (userDto.roleIds) {
        user.roles = userDto.roleIds.map((id: number) => ({ id })) as any;
        delete userDto.roleIds;
     }

       if (userDto.locationId) {
         user.location = { id: userDto.locationId } as any;
         delete userDto.locationId;
       }

       Object.assign(user, userDto);
       return this.usersRepo.save(user);
   }
async getUserLocationWithChildren(userId: number) {
  const user = await this.usersRepo.findOne({
    where: { id: userId },
    relations: ['location', 'location.parent', 'roles'],
  });

  if (!user) {
    throw new NotFoundException(`User with ID ${userId} not found`);
  }

  const roleNames = user.roles.map(r => r.name.toLowerCase());
  let rootLocation = user.location;

  if (roleNames.includes('facility-incharge user')) {
    if (rootLocation.type === 'facility' && rootLocation.parent) {
      rootLocation = rootLocation.parent;
    }
  } else if (roleNames.includes('subcounty user')) {
    if (rootLocation.type === 'facility' && rootLocation.parent) {
      rootLocation = rootLocation.parent;
    }
  } else if (roleNames.includes('county user')) {
    if (rootLocation.type === 'facility' && rootLocation.parent?.parent) {
      rootLocation = rootLocation.parent.parent;
    } else if (rootLocation.type === 'subcounty' && rootLocation.parent) {
      rootLocation = rootLocation.parent;
    }
  } else if (roleNames.includes('admin')) {

  }

  const locationTree = await this.locationsService.getLocationWithChildren(rootLocation.id);

  function cleanLocation(loc: any, parentId: | null = null) {
    const { id, name, type, children } = loc;
    return {
      id: id,
      name,
      type,
      parentId,
      children: children?.map((child: any) => cleanLocation(child, id)) ?? [],
    };
  }

  return {
    location: cleanLocation(locationTree),
  };
}





}

