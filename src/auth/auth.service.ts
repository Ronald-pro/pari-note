import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { buildLocationTree } from '../utils/location.helper';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string) {
        const user = await this.usersService.findByEmail(email);
        if (user && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(userPayload: any) {
        const user = await this.usersService.findById(userPayload.id);

        if (!user) {
            throw new UnauthorizedException('Invalid user');
        }

        const roles = user.roles?.map((r) => r.name) || [];

        const payload = { sub: user.id, email: user.email, roles, };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                roles,
                location: buildLocationTree(user.location),
            },
        };
    }
}
