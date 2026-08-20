import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTeacherProfileDto } from './dto/create-teacher-profile.dto';
import { UpdateTeacherProfileDto } from './dto/update-teacher-profile.dto';
import { TeacherProfile } from './entities/teacher-profile.entity';

interface MysqlDriverError {
  code?: string;
}

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(TeacherProfile)
    private readonly profileRepository: Repository<TeacherProfile>,
  ) {}

  async findByUserId(userId: string): Promise<TeacherProfile> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Teacher profile has not been created yet');
    }
    return profile;
  }

  async create(
    userId: string,
    dto: CreateTeacherProfileDto,
  ): Promise<TeacherProfile> {
    const existing = await this.profileRepository.findOne({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException('Teacher profile already exists');
    }

    const profile = this.profileRepository.create({ ...dto, userId });
    return this.save(profile);
  }

  async update(
    userId: string,
    dto: UpdateTeacherProfileDto,
  ): Promise<TeacherProfile> {
    const profile = await this.findByUserId(userId);
    Object.assign(profile, dto);
    return this.save(profile);
  }

  private async save(profile: TeacherProfile): Promise<TeacherProfile> {
    try {
      return await this.profileRepository.save(profile);
    } catch (error: unknown) {
      if ((error as MysqlDriverError)?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Employee ID is already in use');
      }
      throw error;
    }
  }
}
