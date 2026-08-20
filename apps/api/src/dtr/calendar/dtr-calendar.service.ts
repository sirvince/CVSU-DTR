import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DayOfWeek } from '../../common/enums/day-of-week.enum';
import { SchedulesService } from '../../schedules/schedules.service';
import { DtrDay } from '../days/entities/dtr-day.entity';
import { DtrPeriodsService } from '../periods/dtr-periods.service';

const DAY_OF_WEEK_BY_UTC_INDEX: DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

@Injectable()
export class DtrCalendarService {
  constructor(
    @InjectRepository(DtrDay)
    private readonly dtrDayRepository: Repository<DtrDay>,
    private readonly dtrPeriodsService: DtrPeriodsService,
    private readonly schedulesService: SchedulesService,
  ) {}

  async findAllForTeacher(
    teacherId: string,
    dtrPeriodId: string,
  ): Promise<DtrDay[]> {
    const dtrPeriod = await this.dtrPeriodsService.findOneForTeacher(
      teacherId,
      dtrPeriodId,
    );
    return this.dtrDayRepository.find({
      where: { dtrPeriodId: dtrPeriod.id },
      order: { date: 'ASC' },
    });
  }

  // Idempotent: only inserts DtrDay rows for scheduled dates that don't already
  // have one. Never touches an existing row, so re-running after a teacher has
  // started entering attendance/status can't clobber that data, and a schedule
  // deleted after generation doesn't retroactively remove already-materialized days.
  async generate(teacherId: string, dtrPeriodId: string): Promise<DtrDay[]> {
    const dtrPeriod = await this.dtrPeriodsService.findOneForTeacher(
      teacherId,
      dtrPeriodId,
    );
    const schedules = await this.schedulesService.findAllForTeacher(
      teacherId,
      dtrPeriod.academicPeriodId,
    );
    const scheduleByDay = new Map(schedules.map((s) => [s.dayOfWeek, s]));

    const existing = await this.dtrDayRepository.find({
      where: { dtrPeriodId: dtrPeriod.id },
    });
    const existingDates = new Set(existing.map((d) => d.date));

    const toCreate: DtrDay[] = [];
    for (const date of this.enumerateDates(
      dtrPeriod.startDate,
      dtrPeriod.endDate,
    )) {
      if (existingDates.has(date)) {
        continue;
      }
      const schedule = scheduleByDay.get(this.dayOfWeekFor(date));
      if (!schedule) {
        continue;
      }
      toCreate.push(
        this.dtrDayRepository.create({
          dtrPeriodId: dtrPeriod.id,
          date,
          scheduleStartTime: schedule.startTime,
          scheduleEndTime: schedule.endTime,
          // ENH-001 (confirmed exception to BR-004): a freshly-generated day starts
          // with Arrival/Departure auto-filled from its schedule rather than blank,
          // so a day the teacher actually worked as scheduled needs no typing at
          // all. Still fully editable afterward via PATCH /dtr/days/:date — this
          // only sets the starting value, once, at row-creation time; regenerating
          // never touches an existing row (see the class comment above `generate`).
          arrivalTime: schedule.startTime,
          departureTime: schedule.endTime,
        }),
      );
    }

    if (toCreate.length > 0) {
      await this.dtrDayRepository.save(toCreate);
    }

    return this.dtrDayRepository.find({
      where: { dtrPeriodId: dtrPeriod.id },
      order: { date: 'ASC' },
    });
  }

  // Walks dates as UTC-midnight timestamps so the local machine's timezone can
  // never shift a date-only string like "2026-08-17" off by one day.
  private *enumerateDates(
    startDate: string,
    endDate: string,
  ): Generator<string> {
    const cursor = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);
    while (cursor.getTime() <= end.getTime()) {
      yield cursor.toISOString().slice(0, 10);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  private dayOfWeekFor(date: string): DayOfWeek {
    return DAY_OF_WEEK_BY_UTC_INDEX[new Date(`${date}T00:00:00Z`).getUTCDay()];
  }
}
