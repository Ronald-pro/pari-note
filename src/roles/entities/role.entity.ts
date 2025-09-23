import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Permission } from 'src/permissions/entities/permission.entity';

@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @ManyToMany(() => User, (user) => user.roles)
    users: User[];

    @ManyToMany(() => Permission, permission => permission.roles, { eager: true })
    @JoinTable()
    permissions: Permission[];
}
