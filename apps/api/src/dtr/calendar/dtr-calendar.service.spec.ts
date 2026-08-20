import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { DayOfWeek } from '../../common/enums/day-of-week.enum';
import { DtrDayStatus } from '../../common/enums/dtr-day-status.enum';
import { SchedulesService } from '../../schedules/schedules.service';
import { DtrCalendarService } from './dtr-calendar.service';
import { DtrDay } from '../days/entities/dtr-day.entity';
import { DtrPeriodsService } from '../periods/dtr-periods.service';
import { PhHolidaysService } from './ph-holidays.service';

type MockRepository = Partial<Record<keyof Repository<DtrDay>, jest.Mock>>;

const createMockRepository = (): MockRepository => ({
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('DtrCalendarService', () => {
  let service: DtrCalendarService;
  let repository: MockRepository;
  let dtrPeriodsService: { findOneForTeacher: jest.Mock };
  let schedulesService: { findAllForTeacher: jest.Mock };
  let phHolidaysService: { getHolidays: jest.Mock };

  const dtrPeriod = {
    id: 'dp-1',
    teacherId: 'teacher-1',
    academicPeriodId: 'ap-1',
    startDate: '2026-08-17', // Monday
    endDate: '2026-08-23', // Sunday
  };

  beforeEach(async () => {
    dtrPeriodsService = {
      findOneForTeacher: jest.fn().mockResolvedValue(dtrPeriod),
    };
    schedulesService = { findAllForTeacher: jest.fn().mockResolvedValue([]) };
    // No holidays by default — tests that care about holiday behavior
    // override this per-test. Keeps the pre-existing schedule-only tests
    // below unaffected by the fact that Aug 21 (in the default date range)
    // is a real Philippine holiday.
    phHolidaysService = {
      getHolidays: jest.fn().mockResolvedValue(new Map<string, string>()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DtrCalendarService,
        {
          provide: getRepositoryToken(DtrDay),
          useValue: createMockRepository(),
        },
        { provide: DtrPeriodsService, useValue: dtrPeriodsService },
        { provide: SchedulesService, useValue: schedulesService },
        { provide: PhHolidaysService, useValue: phHolidaysService },
      ],
    }).compile();

    service = module.get(DtrCalendarService);
    repository = module.get(getRepositoryToken(DtrDay));
  });

  describe('findAllForTeacher', () => {
    it('ownership-checks the DTR period, then lists its days ordered by date', async () => {
      repository.find!.mockResolvedValue([]);

      await service.findAllForTeacher('teacher-1', 'dp-1');

      expect(dtrPeriodsService.findOneForTeacher).toHaveBeenCalledWith(
        'teacher-1',
        'dp-1',
      );
      expect(repository.find).toHaveBeenCalledWith({
        where: { dtrPeriodId: 'dp-1' },
        order: { date: 'ASC' },
      });
    });
  });

  describe('generate', () => {
    it('only creates days for dates that have a matching weekly schedule', async () => {
      schedulesService.findAllForTeacher.mockResolvedValue([
        {
          dayOfWeek: DayOfWeek.MONDAY,
          startTime: '07:00:00',
          endTime: '19:00:00',
        },
        {
          dayOfWeek: DayOfWeek.WEDNESDAY,
          startTime: '07:00:00',
          endTime: '19:00:00',
        },
      ]);
      repository.find!.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      repository.create!.mockImplementation((x: Partial<DtrDay>) => x);
      repository.save!.mockResolvedValue(undefined);

      await service.generate('teacher-1', 'dp-1');

      // range is Mon 17 .. Sun 23: only Monday(17) and Wednesday(19) have a schedule
      expect(repository.create).toHaveBeenCalledTimes(2);
      expect(repository.create).toHaveBeenCalledWith({
        dtrPeriodId: 'dp-1',
        date: '2026-08-17',
        scheduleStartTime: '07:00:00',
        scheduleEndTime: '19:00:00',
        arrivalTime: '07:00:00',
        departureTime: '19:00:00',
      });
      expect(repository.create).toHaveBeenCalledWith({
        dtrPeriodId: 'dp-1',
        date: '2026-08-19',
        scheduleStartTime: '07:00:00',
        scheduleEndTime: '19:00:00',
        arrivalTime: '07:00:00',
        departureTime: '19:00:00',
      });
    });

    it('does not recreate a day that already exists', async () => {
      schedulesService.findAllForTeacher.mockResolvedValue([
        {
          dayOfWeek: DayOfWeek.MONDAY,
          startTime: '07:00:00',
          endTime: '19:00:00',
        },
      ]);
      repository
        .find!.mockResolvedValueOnce([
          { dtrPeriodId: 'dp-1', date: '2026-08-17' },
        ])
        .mockResolvedValueOnce([]);

      await service.generate('teacher-1', 'dp-1');

      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('does not persist an existing day that no longer has a matching schedule', async () => {
      schedulesService.findAllForTeacher.mockResolvedValue([]);
      repository
        .find!.mockResolvedValueOnce([
          { dtrPeriodId: 'dp-1', date: '2026-08-17' },
        ])
        .mockResolvedValueOnce([{ dtrPeriodId: 'dp-1', date: '2026-08-17' }]);

      const result = await service.generate('teacher-1', 'dp-1');

      expect(repository.save).not.toHaveBeenCalled();
      expect(result).toEqual([{ dtrPeriodId: 'dp-1', date: '2026-08-17' }]);
    });

    // Confirmed exception to BR-008 — see ph-holidays.ts.
    it('creates a HOLIDAY-status day for a holiday date even with no matching schedule', async () => {
      schedulesService.findAllForTeacher.mockResolvedValue([]); // no schedule at all
      phHolidaysService.getHolidays.mockResolvedValue(
        new Map([['2026-08-21', 'Ninoy Aquino Day']]),
      );
      repository.find!.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      repository.create!.mockImplementation((x: Partial<DtrDay>) => x);
      repository.save!.mockResolvedValue(undefined);

      await service.generate('teacher-1', 'dp-1');

      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(repository.create).toHaveBeenCalledWith({
        dtrPeriodId: 'dp-1',
        date: '2026-08-21',
        scheduleStartTime: undefined,
        scheduleEndTime: undefined,
        status: DtrDayStatus.HOLIDAY,
        reason: 'Ninoy Aquino Day',
      });
    });

    it('a holiday on an otherwise-scheduled date wins over the REGULAR schedule branch, with no arrival/departure auto-fill', async () => {
      schedulesService.findAllForTeacher.mockResolvedValue([
        {
          dayOfWeek: DayOfWeek.FRIDAY,
          startTime: '07:00:00',
          endTime: '19:00:00',
        },
      ]);
      phHolidaysService.getHolidays.mockResolvedValue(
        new Map([['2026-08-21', 'Ninoy Aquino Day']]),
      );
      repository.find!.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      repository.create!.mockImplementation((x: Partial<DtrDay>) => x);
      repository.save!.mockResolvedValue(undefined);

      await service.generate('teacher-1', 'dp-1');

      const calls = repository.create!.mock.calls as [Partial<DtrDay>][];
      const holidayCall = calls.find((call) => call[0].date === '2026-08-21');
      const created = holidayCall?.[0];
      expect(created).toEqual({
        dtrPeriodId: 'dp-1',
        date: '2026-08-21',
        scheduleStartTime: '07:00:00',
        scheduleEndTime: '19:00:00',
        status: DtrDayStatus.HOLIDAY,
        reason: 'Ninoy Aquino Day',
      });
      expect(created).not.toHaveProperty('arrivalTime');
      expect(created).not.toHaveProperty('departureTime');
    });
  });
});
