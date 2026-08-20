import { Test, TestingModule } from '@nestjs/testing';
import { DtrDayStatus } from '../../common/enums/dtr-day-status.enum';
import { DtrCalendarService } from '../calendar/dtr-calendar.service';
import { DtrDay } from '../days/entities/dtr-day.entity';
import { DtrValidationService } from './dtr-validation.service';

describe('DtrValidationService', () => {
  let service: DtrValidationService;
  let dtrCalendarService: { findAllForTeacher: jest.Mock };

  const baseDay: Partial<DtrDay> = {
    id: 'day-1',
    dtrPeriodId: 'dp-1',
    date: '2026-08-17',
    scheduleStartTime: '07:00:00',
    scheduleEndTime: '19:00:00',
    status: DtrDayStatus.REGULAR,
  };

  beforeEach(async () => {
    dtrCalendarService = { findAllForTeacher: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DtrValidationService,
        { provide: DtrCalendarService, useValue: dtrCalendarService },
      ],
    }).compile();

    service = module.get(DtrValidationService);
  });

  it('delegates the day list to DtrCalendarService.findAllForTeacher (ownership-checked there)', async () => {
    dtrCalendarService.findAllForTeacher.mockResolvedValue([]);

    await service.validate('teacher-1', 'dp-1');

    expect(dtrCalendarService.findAllForTeacher).toHaveBeenCalledWith(
      'teacher-1',
      'dp-1',
    );
  });

  it('flags a fully-attended, on-time regular day as clean', async () => {
    dtrCalendarService.findAllForTeacher.mockResolvedValue([
      { ...baseDay, arrivalTime: '07:00:00', departureTime: '19:00:00' },
    ]);

    const result = await service.validate('teacher-1', 'dp-1');

    expect(result[0].warnings).toEqual([]);
  });

  it('warns on missing arrival independently of departure', async () => {
    dtrCalendarService.findAllForTeacher.mockResolvedValue([
      { ...baseDay, arrivalTime: undefined, departureTime: '18:58:00' },
    ]);

    const result = await service.validate('teacher-1', 'dp-1');

    expect(result[0].warnings).toContain('Missing Arrival');
    expect(result[0].warnings).not.toContain('Missing Departure');
  });

  it('warns on missing departure independently of arrival', async () => {
    dtrCalendarService.findAllForTeacher.mockResolvedValue([
      { ...baseDay, arrivalTime: '07:03:00', departureTime: undefined },
    ]);

    const result = await service.validate('teacher-1', 'dp-1');

    expect(result[0].warnings).toContain('Missing Departure');
    expect(result[0].warnings).not.toContain('Missing Arrival');
  });

  it('warns on both missing when neither is entered', async () => {
    dtrCalendarService.findAllForTeacher.mockResolvedValue([
      { ...baseDay, arrivalTime: undefined, departureTime: undefined },
    ]);

    const result = await service.validate('teacher-1', 'dp-1');

    expect(result[0].warnings).toEqual(
      expect.arrayContaining(['Missing Arrival', 'Missing Departure']),
    );
  });

  it('warns on late arrival compared to schedule', async () => {
    dtrCalendarService.findAllForTeacher.mockResolvedValue([
      { ...baseDay, arrivalTime: '07:35:00', departureTime: '19:00:00' },
    ]);

    const result = await service.validate('teacher-1', 'dp-1');

    expect(result[0].warnings).toContain(
      'Arrival is later than scheduled start.',
    );
  });

  it('warns on early departure compared to schedule', async () => {
    dtrCalendarService.findAllForTeacher.mockResolvedValue([
      { ...baseDay, arrivalTime: '07:00:00', departureTime: '18:00:00' },
    ]);

    const result = await service.validate('teacher-1', 'dp-1');

    expect(result[0].warnings).toContain(
      'Departure is earlier than scheduled end.',
    );
  });

  it('does not flag on-time arrival/departure', async () => {
    dtrCalendarService.findAllForTeacher.mockResolvedValue([
      { ...baseDay, arrivalTime: '07:00:00', departureTime: '19:00:00' },
    ]);

    const result = await service.validate('teacher-1', 'dp-1');

    expect(result[0].warnings).toEqual([]);
  });

  it('never flags a non-REGULAR day, even with no arrival/departure', async () => {
    dtrCalendarService.findAllForTeacher.mockResolvedValue([
      {
        ...baseDay,
        status: DtrDayStatus.SUSPENDED,
        arrivalTime: undefined,
        departureTime: undefined,
      },
    ]);

    const result = await service.validate('teacher-1', 'dp-1');

    expect(result[0].warnings).toEqual([]);
  });
});
