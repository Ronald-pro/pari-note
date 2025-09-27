import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Location } from './entities/location.entity';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class LocationsService {
    constructor(
        @InjectRepository(Location)
        private readonly locRepo: Repository<Location>,
    ) { }

    async create(dto: CreateLocationDto): Promise<Location> {
        const location = this.locRepo.create({
            name: dto.name,
            type: dto.type
        });

        if (dto.parentId) {
            const parent = await this.locRepo.findOne({ where: { id: dto.parentId } });
            if (!parent) {
                throw new NotFoundException(`Parent location with id ${dto.parentId} not found`);
            }
            location.parent = parent;
        }

        if (dto.createdById) {
            location.createdBy = { id: dto.createdById } as User;
        }

        return this.locRepo.save(location);
    }

    async findAll(page = 1, limit = 10): Promise<{ data: Location[]; total: number; page: number; limit: number }> {
        const [data, total] = await this.locRepo.findAndCount({
            relations: ['parent'],
            skip: (page - 1) * limit,
            take: limit,
            order: { id: 'ASC' },
        });

        return { data, total, page, limit };
    }

    async findOne(id: number): Promise<Location> {
        const location = await this.locRepo.findOne({ where: { id }, relations: ['parent', 'children'] });
        if (!location) throw new NotFoundException(`Location with id ${id} not found`);
        return location;
    }

    async update(id: number, dto: UpdateLocationDto): Promise<Location> {
        const location = await this.findOne(id);
        if (dto.name !== undefined) location.name = dto.name;
        if (dto.type !== undefined) location.type = dto.type;

        if (dto.parentId !== undefined) {
            const parent = await this.locRepo.findOne({ where: { id: dto.parentId } });
            if (!parent) {
                throw new NotFoundException(`Parent location with id ${dto.parentId} not found`);
            }
            location.parent = parent;
        }

        return this.locRepo.save(location);
    }

    async remove(id: number): Promise<void> {
        const location = await this.findOne(id);
        await this.locRepo.remove(location);
    }

    async findTree(): Promise<Location[]> {
        return this.locRepo.find({
            where: { parent: IsNull() },
            relations: ['children', 'children.children', 'children.children.children'],
        });
    }

    async getAccessibleLocationIds(locationId: number): Promise<number[]> {
        const ids = [locationId];

        const children = await this.locRepo.find({ where: { parent: { id: locationId } } });
        for (const child of children) {
            ids.push(...await this.getAccessibleLocationIds(child.id));
        }

        return ids;
    }

async getLocationWithChildren(locationId: number) {
  const location = await this.locRepo.findOne({
    where: { id: locationId },
    relations: ['children', 'children.children', 'children.children.children'], 
  });

  if (!location) {
    throw new NotFoundException('Location not found');
  }

  return location;
}



}
