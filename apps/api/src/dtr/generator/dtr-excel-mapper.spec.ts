import { BadRequestException } from '@nestjs/common';
import { DtrDayStatus } from '../../common/enums/dtr-day-status.enum';
import { TeacherProfile } from '../../teachers/entities/teacher-profile.entity';
import { DtrDay } from '../days/entities/dtr-day.entity';
import { DtrPeriod } from '../periods/entities/dtr-period.entity';
import {
  assertSingleCalendarMonth,
  buildFileName,
  formatPeriodLabel,
  formatTeacherName,
  populateDtrSheet,
} from './dtr-excel-mapper';

const profile: Partial<TeacherProfile> = {
  firstName: 'John Vincent',
  lastName: 'Dallego',
};

const profileWithMiddle: Partial<TeacherProfile> = {
  firstName: 'John',
  middleName: 'Vincent',
  lastName: 'Dallego',
};

const period: Partial<DtrPeriod> = {
  startDate: '2026-08-16',
  endDate: '2026-08-31',
};

describe('dtr-excel-mapper', () => {
  describe('formatTeacherName', () => {
    it('formats as LASTNAME, FIRSTNAME', () => {
      expect(formatTeacherName(profile as TeacherProfile)).toBe(
        'DALLEGO, JOHN VINCENT',
      );
    });

    it('includes middle name when present', () => {
      expect(formatTeacherName(profileWithMiddle as TeacherProfile)).toBe(
        'DALLEGO, JOHN VINCENT',
      );
    });
  });

  describe('assertSingleCalendarMonth', () => {
    it('allows a period within one calendar month', () => {
      expect(() =>
        assertSingleCalendarMonth(period as DtrPeriod),
      ).not.toThrow();
    });

    it('rejects a period spanning two calendar months', () => {
      expect(() =>
        assertSingleCalendarMonth({
          startDate: '2026-08-25',
          endDate: '2026-09-05',
        } as DtrPeriod),
      ).toThrow(BadRequestException);
    });
  });

  describe('formatPeriodLabel', () => {
    it('matches the docs example format ("Month start-end, year")', () => {
      expect(formatPeriodLabel(period as DtrPeriod)).toBe('August 16-31, 2026');
    });
  });

  describe('buildFileName', () => {
    it('matches the docs filename convention exactly', () => {
      expect(
        buildFileName(profileWithMiddle as TeacherProfile, period as DtrPeriod),
      ).toBe('DTR_DALLEGO_JOHN-VINCENT_AUG-16-31-2026.xlsx');
    });

    it('omits the middle segment when middleName is not set', () => {
      const noMiddle: Partial<TeacherProfile> = {
        firstName: 'John',
        lastName: 'Dallego',
      };

      expect(
        buildFileName(noMiddle as TeacherProfile, period as DtrPeriod),
      ).toBe('DTR_DALLEGO_JOHN_AUG-16-31-2026.xlsx');
    });
  });

  describe('populateDtrSheet', () => {
    const makeSheetStub = () => {
      const cells = new Map<string, { value: unknown }>();
      return {
        getCell: (address: string) => {
          if (!cells.has(address)) {
            cells.set(address, { value: undefined });
          }
          return cells.get(address)!;
        },
        cells,
      };
    };

    it('writes name and period label to their fixed cells', () => {
      const sheet = makeSheetStub();

      populateDtrSheet(
        sheet as never,
        profileWithMiddle as TeacherProfile,
        period as DtrPeriod,
        [],
      );

      expect(sheet.getCell('D6').value).toBe('DALLEGO, JOHN VINCENT');
      expect(sheet.getCell('H9').value).toBe('August 16-31, 2026');
    });

    it('prefers an explicit period.label over the auto-formatted one', () => {
      const sheet = makeSheetStub();

      populateDtrSheet(
        sheet as never,
        profileWithMiddle as TeacherProfile,
        { ...period, label: 'Custom Label' } as DtrPeriod,
        [],
      );

      expect(sheet.getCell('H9').value).toBe('Custom Label');
    });

    it('security: neutralizes a formula-injection last name (starts with =) before writing the name cell', () => {
      const sheet = makeSheetStub();
      const maliciousProfile: Partial<TeacherProfile> = {
        firstName: 'John',
        lastName: '=HYPERLINK("http://evil.example","Click")',
      };

      populateDtrSheet(
        sheet as never,
        maliciousProfile as TeacherProfile,
        period as DtrPeriod,
        [],
      );

      const value = sheet.getCell('D6').value as string;
      expect(value.startsWith("'")).toBe(true);
      expect(value.startsWith('=')).toBe(false);
    });

    it('security: neutralizes a formula-injection period label (starts with @) before writing the label cell', () => {
      const sheet = makeSheetStub();

      populateDtrSheet(
        sheet as never,
        profileWithMiddle as TeacherProfile,
        { ...period, label: '@SUM(1+1)*cmd|' } as DtrPeriod,
        [],
      );

      const value = sheet.getCell('H9').value as string;
      expect(value.startsWith("'")).toBe(true);
      expect(value.startsWith('@')).toBe(false);
    });

    it('security: does not alter a normal name/label that happens to contain, but not start with, a formula-trigger character', () => {
      const sheet = makeSheetStub();
      const profileWithHyphen: Partial<TeacherProfile> = {
        firstName: 'Mary-Anne',
        lastName: 'Dela-Cruz',
      };

      populateDtrSheet(
        sheet as never,
        profileWithHyphen as TeacherProfile,
        period as DtrPeriod,
        [],
      );

      expect(sheet.getCell('D6').value).toBe('DELA-CRUZ, MARY-ANNE');
    });

    it('writes a morning arrival to AM Arrival (E) and an evening departure to PM Departure (H)', () => {
      const sheet = makeSheetStub();
      const day: Partial<DtrDay> = {
        date: '2026-08-16',
        status: DtrDayStatus.REGULAR,
        arrivalTime: '07:03:00',
        departureTime: '18:58:00',
      };

      populateDtrSheet(
        sheet as never,
        profileWithMiddle as TeacherProfile,
        period as DtrPeriod,
        [day as DtrDay],
      );

      // FIRST_DAY_ROW (17) + dayOfMonth(16) - 1 = 32
      const arrival = sheet.getCell('E32').value as Date;
      const departure = sheet.getCell('H32').value as Date;
      expect(arrival.getUTCHours()).toBe(7);
      expect(arrival.getUTCMinutes()).toBe(3);
      expect(departure.getUTCHours()).toBe(18);
      expect(departure.getUTCMinutes()).toBe(58);
      expect(sheet.getCell('F32').value).toBeUndefined();
      expect(sheet.getCell('G32').value).toBeUndefined();
    });

    it('bug fix: writes an afternoon arrival (>= 12:00) to PM Arrival (G), not AM Arrival (E)', () => {
      const sheet = makeSheetStub();
      const day: Partial<DtrDay> = {
        date: '2026-08-16',
        status: DtrDayStatus.REGULAR,
        arrivalTime: '12:00:00',
      };

      populateDtrSheet(
        sheet as never,
        profileWithMiddle as TeacherProfile,
        period as DtrPeriod,
        [day as DtrDay],
      );

      const arrival = sheet.getCell('G32').value as Date;
      expect(arrival.getUTCHours()).toBe(12);
      expect(sheet.getCell('E32').value).toBeUndefined();
    });

    it('bug fix: writes a morning departure (< 12:00) to AM Departure (F), not PM Departure (H)', () => {
      const sheet = makeSheetStub();
      const day: Partial<DtrDay> = {
        date: '2026-08-16',
        status: DtrDayStatus.REGULAR,
        departureTime: '11:30:00',
      };

      populateDtrSheet(
        sheet as never,
        profileWithMiddle as TeacherProfile,
        period as DtrPeriod,
        [day as DtrDay],
      );

      const departure = sheet.getCell('F32').value as Date;
      expect(departure.getUTCHours()).toBe(11);
      expect(departure.getUTCMinutes()).toBe(30);
      expect(sheet.getCell('H32').value).toBeUndefined();
    });

    it('leaves arrival/departure cells untouched when blank', () => {
      const sheet = makeSheetStub();
      const day: Partial<DtrDay> = {
        date: '2026-08-17',
        status: DtrDayStatus.SUSPENDED,
        arrivalTime: undefined,
        departureTime: undefined,
      };

      populateDtrSheet(
        sheet as never,
        profileWithMiddle as TeacherProfile,
        period as DtrPeriod,
        [day as DtrDay],
      );

      expect(sheet.getCell('E33').value).toBeUndefined();
      expect(sheet.getCell('H33').value).toBeUndefined();
    });

    it('writes the scheduled shift shorthand into the shift-note column for REGULAR days', () => {
      const sheet = makeSheetStub();
      const day: Partial<DtrDay> = {
        date: '2026-08-03',
        status: DtrDayStatus.REGULAR,
        scheduleStartTime: '07:00:00',
        scheduleEndTime: '19:00:00',
      };

      populateDtrSheet(
        sheet as never,
        profileWithMiddle as TeacherProfile,
        period as DtrPeriod,
        [day as DtrDay],
      );

      // FIRST_DAY_ROW (17) + dayOfMonth(3) - 1 = 19
      expect(sheet.getCell('B19').value).toBe('7-7');
    });

    it('includes minutes in the shift shorthand when the schedule is not on the hour', () => {
      const sheet = makeSheetStub();
      const day: Partial<DtrDay> = {
        date: '2026-08-03',
        status: DtrDayStatus.REGULAR,
        scheduleStartTime: '07:30:00',
        scheduleEndTime: '16:30:00',
      };

      populateDtrSheet(
        sheet as never,
        profileWithMiddle as TeacherProfile,
        period as DtrPeriod,
        [day as DtrDay],
      );

      expect(sheet.getCell('B19').value).toBe('7:30-4:30');
    });

    it('leaves the shift-note column empty for a REGULAR day with no schedule snapshot', () => {
      const sheet = makeSheetStub();
      const day: Partial<DtrDay> = {
        date: '2026-08-03',
        status: DtrDayStatus.REGULAR,
      };

      populateDtrSheet(
        sheet as never,
        profileWithMiddle as TeacherProfile,
        period as DtrPeriod,
        [day as DtrDay],
      );

      expect(sheet.getCell('B19').value).toBeUndefined();
    });

    it('writes status (+ reason) into the shift-note column for non-REGULAR days', () => {
      const sheet = makeSheetStub();
      const day: Partial<DtrDay> = {
        date: '2026-08-17',
        status: DtrDayStatus.SUSPENDED,
        reason: 'Class Suspension',
      };

      populateDtrSheet(
        sheet as never,
        profileWithMiddle as TeacherProfile,
        period as DtrPeriod,
        [day as DtrDay],
      );

      expect(sheet.getCell('B33').value).toBe('SUSPENDED - Class Suspension');
    });

    it('does not write anything into the shift-note column for REGULAR days', () => {
      const sheet = makeSheetStub();
      const day: Partial<DtrDay> = {
        date: '2026-08-17',
        status: DtrDayStatus.REGULAR,
        arrivalTime: '07:00:00',
        departureTime: '19:00:00',
      };

      populateDtrSheet(
        sheet as never,
        profileWithMiddle as TeacherProfile,
        period as DtrPeriod,
        [day as DtrDay],
      );

      expect(sheet.getCell('B33').value).toBeUndefined();
    });
  });
});
