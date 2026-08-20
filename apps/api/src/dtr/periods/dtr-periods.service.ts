import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { AcademicPeriodsService } from '../../academic-periods/academic-periods.service';
import { AcademicPeriod } from '../../academic-periods/entities/academic-period.entity';
import { CreateDtrPeriodDto } from './dto/create-dtr-period.dto';
import { UpdateDtrPeriodDto } from './dto/update-dtr-period.dto';
import { DtrPeriod } from './entities/dtr-period.entity';

interface MysqlDriverError {
  code?: string;
}

@Injectable()
export class DtrPeriodsService {
  constructor(
    @InjectRepository(DtrPeriod)
    private readonly dtrPeriodRepository: Repository<DtrPeriod>,
    private readonly academicPeriodsService: AcademicPeriodsService,
  ) {}

  findAllForTeacher(
    teacherId: string,
    academicPeriodId?: string,
  ): Promise<DtrPeriod[]> {
    const where: FindOptionsWhere<DtrPeriod> = { teacherId };
    if (academicPeriodId) {
      where.academicPeriodId = academicPeriodId;
    }
    return this.dtrPeriodRepository.find({
      where,
      order: { startDate: 'DESC' },
    });
  }

  async findOneForTeacher(teacherId: string, id: string): Promise<DtrPeriod> {
    const period = await this.dtrPeriodRepository.findOne({
      where: { id, teacherId },
    });
    if (!period) {
      throw new NotFoundException('DTR period not found');
    }
    return period;
  }

  async create(teacherId: string, dto: CreateDtrPeriodDto): Promise<DtrPeriod> {
    // academic-periods is a shared resource now (any teacher may reference
    // any period) — this is a plain existence check, not an ownership one.
    const academicPeriod = await this.academicPeriodsService.findOne(
      dto.academicPeriodId,
    );
    this.assertValidDateRange(dto.startDate, dto.endDate);
    this.assertWithinAcademicPeriod(academicPeriod, dto.startDate, dto.endDate);

    const period = this.dtrPeriodRepository.create({ ...dto, teacherId });
    return this.save(period);
  }

  async update(
    teacherId: string,
    id: string,
    dto: UpdateDtrPeriodDto,
  ): Promise<DtrPeriod> {
    const period = await this.findOneForTeacher(teacherId, id);

    let academicPeriod: AcademicPeriod | undefined;
    if (
      dto.academicPeriodId &&
      dto.academicPeriodId !== period.academicPeriodId
    ) {
      academicPeriod = await this.academicPeriodsService.findOne(
        dto.academicPeriodId,
      );
    }

    Object.assign(period, dto);
    this.assertValidDateRange(period.startDate, period.endDate);

    academicPeriod ??= await this.academicPeriodsService.findOne(
      period.academicPeriodId,
    );
    this.assertWithinAcademicPeriod(
      academicPeriod,
      period.startDate,
      period.endDate,
    );

    return this.save(period);
  }

  async remove(teacherId: string, id: string): Promise<void> {
    const period = await this.findOneForTeacher(teacherId, id);
    await this.dtrPeriodRepository.remove(period);
  }

  private assertValidDateRange(startDate: string, endDate: string): void {
    if (new Date(startDate).getTime() >= new Date(endDate).getTime()) {
      throw new BadRequestException('startDate must be earlier than endDate');
    }
  }

  private assertWithinAcademicPeriod(
    academicPeriod: AcademicPeriod,
    startDate: string,
    endDate: string,
  ): void {
    const withinStart =
      new Date(startDate).getTime() >=
      new Date(academicPeriod.startDate).getTime();
    const withinEnd =
      new Date(endDate).getTime() <= new Date(academicPeriod.endDate).getTime();
    if (!withinStart || !withinEnd) {
      throw new BadRequestException(
        'DTR period must fall within the selected academic period',
      );
    }
  }

  private async save(period: DtrPeriod): Promise<DtrPeriod> {
    try {
      return await this.dtrPeriodRepository.save(period);
    } catch (error: unknown) {
      if ((error as MysqlDriverError)?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(
          'A DTR period with this date range already exists in this academic period',
        );
      }
      throw error;
    }
  }
}
