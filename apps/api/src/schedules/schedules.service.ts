import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { AcademicPeriodsService } from '../academic-periods/academic-periods.service';
import { CreateTeacherScheduleDto } from './dto/create-teacher-schedule.dto';
import { UpdateTeacherScheduleDto } from './dto/update-teacher-schedule.dto';
import { TeacherSchedule } from './entities/teacher-schedule.entity';

interface MysqlDriverError {
  code?: string;
}

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(TeacherSchedule)
    private readonly scheduleRepository: Repository<TeacherSchedule>,
    private readonly academicPeriodsService: AcademicPeriodsService,
  ) {}

  findAllForTeacher(
    teacherId: string,
    academicPeriodId?: string,
  ): Promise<TeacherSchedule[]> {
    const where: FindOptionsWhere<TeacherSchedule> = { teacherId };
    if (academicPeriodId) {
      where.academicPeriodId = academicPeriodId;
    }
    return this.scheduleRepository.find({
      where,
      order: { dayOfWeek: 'ASC' },
    });
  }

  async findOneForTeacher(
    teacherId: string,
    id: string,
  ): Promise<TeacherSchedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id, teacherId },
    });
    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }
    return schedule;
  }

  async create(
    teacherId: string,
    dto: CreateTeacherScheduleDto,
  ): Promise<TeacherSchedule> {
    // academic-periods is a shared resource now (any teacher may reference
    // any period) — this is a plain existence check, not an ownership one.
    await this.academicPeriodsService.findOne(dto.academicPeriodId);
    const startTime = this.normalizeTime(dto.startTime);
    const endTime = this.normalizeTime(dto.endTime);
    this.assertValidTimeRange(startTime, endTime);

    const schedule = this.scheduleRepository.create({
      ...dto,
      startTime,
      endTime,
      teacherId,
    });
    return this.save(schedule);
  }

  async update(
    teacherId: string,
    id: string,
    dto: UpdateTeacherScheduleDto,
  ): Promise<TeacherSchedule> {
    const schedule = await this.findOneForTeacher(teacherId, id);

    if (
      dto.academicPeriodId &&
      dto.academicPeriodId !== schedule.academicPeriodId
    ) {
      await this.academicPeriodsService.findOne(dto.academicPeriodId);
    }

    Object.assign(schedule, {
      ...dto,
      ...(dto.startTime && { startTime: this.normalizeTime(dto.startTime) }),
      ...(dto.endTime && { endTime: this.normalizeTime(dto.endTime) }),
    });
    this.assertValidTimeRange(schedule.startTime, schedule.endTime);
    return this.save(schedule);
  }

  async remove(teacherId: string, id: string): Promise<void> {
    const schedule = await this.findOneForTeacher(teacherId, id);
    await this.scheduleRepository.remove(schedule);
  }

  private assertValidTimeRange(startTime: string, endTime: string): void {
    if (startTime >= endTime) {
      throw new BadRequestException('startTime must be earlier than endTime');
    }
  }

  // Matches the "HH:mm:ss" MySQL returns, so create/update responses don't differ from a later GET.
  private normalizeTime(time: string): string {
    return time.length === 5 ? `${time}:00` : time;
  }

  private async save(schedule: TeacherSchedule): Promise<TeacherSchedule> {
    try {
      return await this.scheduleRepository.save(schedule);
    } catch (error: unknown) {
      if ((error as MysqlDriverError)?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(
          'A schedule for this day already exists in this academic period',
        );
      }
      throw error;
    }
  }
}
