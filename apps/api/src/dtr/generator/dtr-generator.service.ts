import { randomUUID } from 'node:crypto';
import { access, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Excel from 'exceljs';
import { Repository } from 'typeorm';
import { TeachersService } from '../../teachers/teachers.service';
import { DtrCalendarService } from '../calendar/dtr-calendar.service';
import { DtrPeriodsService } from '../periods/dtr-periods.service';
import {
  assertSingleCalendarMonth,
  buildFileName,
  populateDtrSheet,
} from './dtr-excel-mapper';
import { DtrGeneration } from './entities/dtr-generation.entity';

const TEMPLATE_SHEET_NAME = 'DTR';

@Injectable()
export class DtrGeneratorService {
  constructor(
    @InjectRepository(DtrGeneration)
    private readonly dtrGenerationRepository: Repository<DtrGeneration>,
    private readonly dtrPeriodsService: DtrPeriodsService,
    private readonly dtrCalendarService: DtrCalendarService,
    private readonly teachersService: TeachersService,
    private readonly configService: ConfigService,
  ) {}

  async generate(
    teacherId: string,
    dtrPeriodId: string,
  ): Promise<DtrGeneration> {
    const period = await this.dtrPeriodsService.findOneForTeacher(
      teacherId,
      dtrPeriodId,
    );
    assertSingleCalendarMonth(period);

    const profile = await this.teachersService.findByUserId(teacherId);
    const days = await this.dtrCalendarService.findAllForTeacher(
      teacherId,
      dtrPeriodId,
    );

    const workbook = new Excel.Workbook();
    await workbook.xlsx.readFile(
      this.configService.get<string>('dtr.templatePath')!,
    );
    const sheet = workbook.getWorksheet(TEMPLATE_SHEET_NAME);
    if (!sheet) {
      throw new InternalServerErrorException(
        `DTR master template is missing the expected "${TEMPLATE_SHEET_NAME}" sheet`,
      );
    }
    populateDtrSheet(sheet, profile, period, days);

    const storagePath = this.configService.get<string>('dtr.storagePath')!;
    await mkdir(storagePath, { recursive: true });
    // Disk filename is a random uuid, independent of the human-readable
    // `fileName` (which repeats across regenerations of the same period) —
    // avoids overwriting a prior version's file when a teacher regenerates.
    const filePath = join(storagePath, `${randomUUID()}.xlsx`);
    await workbook.xlsx.writeFile(filePath);

    const version =
      (await this.dtrGenerationRepository.count({
        where: { dtrPeriodId: period.id },
      })) + 1;

    const generation = this.dtrGenerationRepository.create({
      teacherId,
      dtrPeriodId: period.id,
      version,
      fileName: buildFileName(profile, period),
      filePath,
      generatedAt: new Date(),
    });
    return this.dtrGenerationRepository.save(generation);
  }

  async findGenerationForTeacher(
    teacherId: string,
    id: string,
  ): Promise<DtrGeneration> {
    const generation = await this.dtrGenerationRepository.findOne({
      where: { id, teacherId },
    });
    if (!generation) {
      throw new NotFoundException('DTR generation not found');
    }
    return generation;
  }

  async resolveDownload(
    teacherId: string,
    id: string,
  ): Promise<{ filePath: string; fileName: string }> {
    const generation = await this.findGenerationForTeacher(teacherId, id);
    const filePath = resolve(generation.filePath);
    try {
      await access(filePath);
    } catch {
      throw new NotFoundException(
        'The generated DTR file is no longer available — generate it again',
      );
    }
    return { filePath, fileName: generation.fileName };
  }
}
