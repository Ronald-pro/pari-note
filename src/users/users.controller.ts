import { Controller, Get, Post, Body, Param, Put, UseGuards, Request, SetMetadata } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UsersService } from './users.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @SetMetadata('permission', 'user:create')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('register')
    async register(@Body() body: any) {
        return this.usersService.create(body);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async profile(@Request() req) {
        return this.usersService.findById(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('user-location')
    async getUsersWithinLocation(@Request() req) {
        return this.usersService.findUsersInLocation(req.user.id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Get()
    async findAll() {
        return this.usersService.findAll();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Put(':id')
    async updateUser(@Param('id') id: number, @Body() body: any) {
        return this.usersService.updateUser(id, body);
    }
}
