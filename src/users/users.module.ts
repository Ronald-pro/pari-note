import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { LocationsModule } from 'src/locations/locations.module';
import { Role } from 'src/roles/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role]),
  LocationsModule,
],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule { }
