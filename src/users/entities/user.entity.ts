import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable, DeleteDateColumn } from 'typeorm';
import { Location } from '../../locations/entities/location.entity';
import { Role } from 'src/roles/entities/role.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column()
    name: string;

    @ManyToOne(() => Location, { nullable: true })
    @JoinColumn({ name: 'location_id' })
    location: Location;

    @ManyToMany(() => Role, (role) => role.users, { eager: true })
    @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
    })
    roles: Role[];

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'created_by' })
    createdBy: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'updated_by' })
    updatedBy: User;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;
}
