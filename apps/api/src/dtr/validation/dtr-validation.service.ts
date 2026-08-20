import { Injectable } from '@nestjs/common';
import { DtrDayStatus } from '../../common/enums/dtr-day-status.enum';
import { DtrCalendarService } from '../calendar/dtr-calendar.service';
import { DtrDay } from '../days/entities/dtr-day.entity';

export interface DtrDayWithWarnings extends DtrDay {
  warnings: string[];
}

@Injectable()
export class DtrValidationService {
  constructor(private readonly dtrCalendarService: DtrCalendarService) {}

  async validate(
    teacherId: string,
    dtrPeriodId: string,
  ): Promise<DtrDayWithWarnings[]> {
    const days = await this.dtrCalendarService.findAllForTeacher(
      teacherId,
      dtrPeriodId,
    );
    return days.map((day) => ({ ...day, warnings: this.warningsFor(day) }));
  }

  // Warnings only — never blocks a save and never implies a payroll/eligibility
  // decision (BR-008). Only REGULAR days get checked: a SUSPENDED/HOLIDAY/etc.
  // day's blank Arrival/Departure is expected (BR-006), not something to flag.
  private warningsFor(day: DtrDay): string[] {
    if (day.status !== DtrDayStatus.REGULAR) {
      return [];
    }

    const warnings: string[] = [];
    if (!day.arrivalTime) {
      warnings.push('Missing Arrival');
    }
    if (!day.departureTime) {
      warnings.push('Missing Departure');
    }
    if (
      day.arrivalTime &&
      day.scheduleStartTime &&
      day.arrivalTime > day.scheduleStartTime
    ) {
      warnings.push('Arrival is later than scheduled start.');
    }
    if (
      day.departureTime &&
      day.scheduleEndTime &&
      day.departureTime < day.scheduleEndTime
    ) {
      warnings.push('Departure is earlier than scheduled end.');
    }
    return warnings;
  }
}
