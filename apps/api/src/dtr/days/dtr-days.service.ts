import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DtrPeriodsService } from '../periods/dtr-periods.service';
import { UpdateDtrDayDto } from './dto/update-dtr-day.dto';
import { DtrDay } from './entities/dtr-day.entity';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class DtrDaysService {
  constructor(
    @InjectRepository(DtrDay)
    private readonly dtrDayRepository: Repository<DtrDay>,
    private readonly dtrPeriodsService: DtrPeriodsService,
  ) {}

  async findOneForTeacher(
    teacherId: string,
    dtrPeriodId: string,
    date: string,
  ): Promise<DtrDay> {
    this.assertValidDateFormat(date);
    // Ownership-checks dtrPeriodId; a day only ever belongs to a period the
    // teacher owns, so this transitively scopes the day lookup to the teacher.
    await this.dtrPeriodsService.findOneForTeacher(teacherId, dtrPeriodId);

    const day = await this.dtrDayRepository.findOne({
      where: { dtrPeriodId, date },
    });
    if (!day) {
      throw new NotFoundException(
        'DTR day not found — generate the DTR calendar first if this date is expected to be scheduled',
      );
    }
    return day;
  }

  async update(
    teacherId: string,
    dtrPeriodId: string,
    date: string,
    dto: UpdateDtrDayDto,
  ): Promise<DtrDay> {
    const day = await this.findOneForTeacher(teacherId, dtrPeriodId, date);

    const arrivalTime =
      dto.arrivalTime !== undefined
        ? this.normalizeTime(dto.arrivalTime)
        : day.arrivalTime;
    const departureTime =
      dto.departureTime !== undefined
        ? this.normalizeTime(dto.departureTime)
        : day.departureTime;
    this.assertValidAttendanceRange(arrivalTime, departureTime);

    day.arrivalTime = arrivalTime;
    day.departureTime = departureTime;
    // Deliberately no auto-clear of arrival/departure when status changes to a
    // special one (BR-006 permits, doesn't require, blank arrival/departure) —
    // the system doesn't decide the correct treatment, the teacher does.
    if (dto.status !== undefined) {
      day.status = dto.status;
    }
    if (dto.reason !== undefined) {
      day.reason = dto.reason;
    }
    if (dto.remarks !== undefined) {
      day.remarks = dto.remarks;
    }
    return this.dtrDayRepository.save(day);
  }

  // Resolves the "no DELETE" gap this module was originally built without
  // (see dtr-calendar.service.ts's generate() — there was previously no way
  // to remove a stale/unwanted DtrDay row at all). Added specifically so a
  // teacher can remove an auto-created holiday row that doesn't apply to
  // them; not restricted to holiday-status rows though, since there's no
  // principled reason a teacher shouldn't be able to remove any day of
  // their own data — same trust-the-teacher stance as the no-auto-clear
  // decision in update() above.
  //
  // Deliberately NOT idempotent against calendar regeneration: if the
  // removed date still matches a holiday (or a schedule) when
  // DtrCalendarService.generate() next runs, it will be re-created, since
  // generate() only ever checks "does a row already exist for this date,"
  // not "did a teacher previously remove one." Acceptable for now — no
  // tombstone/soft-delete concept exists in this schema — but worth
  // revisiting if this turns out to be a common annoyance in practice.
  async remove(
    teacherId: string,
    dtrPeriodId: string,
    date: string,
  ): Promise<void> {
    const day = await this.findOneForTeacher(teacherId, dtrPeriodId, date);
    await this.dtrDayRepository.remove(day);
  }

  private assertValidDateFormat(date: string): void {
    if (!DATE_PATTERN.test(date)) {
      throw new BadRequestException('date must be in YYYY-MM-DD format');
    }
  }

  private assertValidAttendanceRange(
    arrivalTime?: string,
    departureTime?: string,
  ): void {
    if (arrivalTime && departureTime && arrivalTime >= departureTime) {
      throw new BadRequestException(
        'arrivalTime must be earlier than departureTime',
      );
    }
  }

  // Matches the "HH:mm:ss" MySQL returns, so update responses don't differ from a later GET.
  private normalizeTime(time: string): string {
    return time.length === 5 ? `${time}:00` : time;
  }
}
