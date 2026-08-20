import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAcademicPeriodDto } from './dto/create-academic-period.dto';
import { UpdateAcademicPeriodDto } from './dto/update-academic-period.dto';
import { AcademicPeriod } from './entities/academic-period.entity';

interface MysqlDriverError {
  code?: string;
}

@Injectable()
export class AcademicPeriodsService {
  constructor(
    @InjectRepository(AcademicPeriod)
    private readonly academicPeriodRepository: Repository<AcademicPeriod>,
  ) {}

  findAllForTeacher(teacherId: string): Promise<AcademicPeriod[]> {
    return this.academicPeriodRepository.find({
      where: { teacherId },
      order: { startDate: 'DESC' },
    });
  }

  async findOneForTeacher(
    teacherId: string,
    id: string,
  ): Promise<AcademicPeriod> {
    const period = await this.academicPeriodRepository.findOne({
      where: { id, teacherId },
    });
    if (!period) {
      throw new NotFoundException('Academic period not found');
    }
    return period;
  }

  async create(
    teacherId: string,
    dto: CreateAcademicPeriodDto,
  ): Promise<AcademicPeriod> {
    this.assertValidDateRange(dto.startDate, dto.endDate);

    const period = this.academicPeriodRepository.create({
      ...dto,
      teacherId,
    });
    return this.save(period);
  }

  async update(
    teacherId: string,
    id: string,
    dto: UpdateAcademicPeriodDto,
  ): Promise<AcademicPeriod> {
    const period = await this.findOneForTeacher(teacherId, id);
    Object.assign(period, dto);
    this.assertValidDateRange(period.startDate, period.endDate);
    return this.save(period);
  }

  async remove(teacherId: string, id: string): Promise<void> {
    const period = await this.findOneForTeacher(teacherId, id);
    await this.academicPeriodRepository.remove(period);
  }

  private assertValidDateRange(startDate: string, endDate: string): void {
    if (new Date(startDate).getTime() >= new Date(endDate).getTime()) {
      throw new BadRequestException('startDate must be earlier than endDate');
    }
  }

  private async save(period: AcademicPeriod): Promise<AcademicPeriod> {
    try {
      return await this.academicPeriodRepository.save(period);
    } catch (error: unknown) {
      if ((error as MysqlDriverError)?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(
          'An academic period with this academic year and semester already exists',
        );
      }
      throw error;
    }
  }
}
