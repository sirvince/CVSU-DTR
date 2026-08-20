import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  create(data: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  // Admin-only "view all teacher registrations" — a left join, not an
  // inner join, so a registered teacher with no TeacherProfile yet (profile
  // creation is a separate, optional step after registration) still shows
  // up, just with teacherProfile: null rather than being silently excluded.
  //
  // Explicit .select()/.addSelect() (not .leftJoinAndSelect(), which would
  // pull every User column) — this codebase has no
  // ClassSerializerInterceptor/@Exclude anywhere, and every controller just
  // returns whatever the service hands back, so leaving passwordHash off
  // the selected columns is the only thing stopping every teacher's bcrypt
  // hash from being serialized straight into this admin response.
  findAllTeachersWithProfiles(): Promise<User[]> {
    return this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.teacherProfile', 'profile')
      .select([
        'user.id',
        'user.createdAt',
        'user.updatedAt',
        'user.email',
        'user.role',
        'user.isActive',
      ])
      .addSelect([
        'profile.id',
        'profile.userId',
        'profile.employeeId',
        'profile.firstName',
        'profile.middleName',
        'profile.lastName',
        'profile.position',
        'profile.department',
        'profile.campus',
      ])
      .where('user.role = :role', { role: UserRole.TEACHER })
      .orderBy('user.createdAt', 'DESC')
      .getMany();
  }
}
