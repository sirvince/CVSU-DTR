import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { DtrDayStatus } from '../../common/enums/dtr-day-status.enum';
import { DtrDaysService } from './dtr-days.service';
import { DtrDay } from './entities/dtr-day.entity';
import { DtrPeriodsService } from '../periods/dtr-periods.service';

type MockRepository = Partial<Record<keyof Repository<DtrDay>, jest.Mock>>;

const createMockRepository = (): MockRepository => ({
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('DtrDaysService', () => {
  let service: DtrDaysService;
  let repository: MockRepository;
  let dtrPeriodsService: { findOneForTeacher: jest.Mock };

  beforeEach(async () => {
    dtrPeriodsService = {
      findOneForTeacher: jest.fn().mockResolvedValue({ id: 'dp-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DtrDaysService,
        {
          provide: getRepositoryToken(DtrDay),
          useValue: createMockRepository(),
        },
        { provide: DtrPeriodsService, useValue: dtrPeriodsService },
      ],
    }).compile();

    service = module.get(DtrDaysService);
    repository = module.get(getRepositoryToken(DtrDay));
  });

  describe('findOneForTeacher', () => {
    it('rejects a malformed date before touching the DB', async () => {
      await expect(
        service.findOneForTeacher('teacher-1', 'dp-1', 'not-a-date'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(dtrPeriodsService.findOneForTeacher).not.toHaveBeenCalled();
    });

    it('ownership-checks the DTR period before looking up the day', async () => {
      repository.findOne!.mockResolvedValue({
        dtrPeriodId: 'dp-1',
        date: '2026-08-17',
      });

      await service.findOneForTeacher('teacher-1', 'dp-1', '2026-08-17');

      expect(dtrPeriodsService.findOneForTeacher).toHaveBeenCalledWith(
        'teacher-1',
        'dp-1',
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { dtrPeriodId: 'dp-1', date: '2026-08-17' },
      });
    });

    it('throws NotFoundException when the day was never generated', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(
        service.findOneForTeacher('teacher-1', 'dp-1', '2026-08-17'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('sets arrival/departure and normalizes HH:mm to HH:mm:ss', async () => {
      repository.findOne!.mockResolvedValue({
        dtrPeriodId: 'dp-1',
        date: '2026-08-17',
        arrivalTime: undefined,
        departureTime: undefined,
      });
      repository.save!.mockImplementation((d: DtrDay) => Promise.resolve(d));

      const result = await service.update('teacher-1', 'dp-1', '2026-08-17', {
        arrivalTime: '07:03',
        departureTime: '18:58',
      });

      expect(result.arrivalTime).toBe('07:03:00');
      expect(result.departureTime).toBe('18:58:00');
    });

    it('leaves an unspecified field unchanged on a partial update', async () => {
      repository.findOne!.mockResolvedValue({
        dtrPeriodId: 'dp-1',
        date: '2026-08-17',
        arrivalTime: '07:00:00',
        departureTime: '19:00:00',
      });
      repository.save!.mockImplementation((d: DtrDay) => Promise.resolve(d));

      const result = await service.update('teacher-1', 'dp-1', '2026-08-17', {
        arrivalTime: '07:05',
      });

      expect(result.arrivalTime).toBe('07:05:00');
      expect(result.departureTime).toBe('19:00:00');
    });

    it('rejects an arrival that is not earlier than departure', async () => {
      repository.findOne!.mockResolvedValue({
        dtrPeriodId: 'dp-1',
        date: '2026-08-17',
        arrivalTime: undefined,
        departureTime: undefined,
      });

      await expect(
        service.update('teacher-1', 'dp-1', '2026-08-17', {
          arrivalTime: '19:00',
          departureTime: '07:00',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('rejects when a new arrival would be after the existing departure', async () => {
      repository.findOne!.mockResolvedValue({
        dtrPeriodId: 'dp-1',
        date: '2026-08-17',
        arrivalTime: '07:00:00',
        departureTime: '08:00:00',
      });

      await expect(
        service.update('teacher-1', 'dp-1', '2026-08-17', {
          arrivalTime: '09:00',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('sets status, reason, and remarks together', async () => {
      repository.findOne!.mockResolvedValue({
        dtrPeriodId: 'dp-1',
        date: '2026-08-17',
        status: DtrDayStatus.REGULAR,
        arrivalTime: undefined,
        departureTime: undefined,
      });
      repository.save!.mockImplementation((d: DtrDay) => Promise.resolve(d));

      const result = await service.update('teacher-1', 'dp-1', '2026-08-17', {
        status: DtrDayStatus.SUSPENDED,
        reason: 'Class Suspension',
        remarks: 'Classes suspended due to weather',
      });

      expect(result.status).toBe(DtrDayStatus.SUSPENDED);
      expect(result.reason).toBe('Class Suspension');
      expect(result.remarks).toBe('Classes suspended due to weather');
    });

    it('leaves status/reason/remarks unchanged when not specified', async () => {
      repository.findOne!.mockResolvedValue({
        dtrPeriodId: 'dp-1',
        date: '2026-08-17',
        status: DtrDayStatus.HOLIDAY,
        reason: 'Existing reason',
        remarks: 'Existing remarks',
        arrivalTime: undefined,
        departureTime: undefined,
      });
      repository.save!.mockImplementation((d: DtrDay) => Promise.resolve(d));

      const result = await service.update('teacher-1', 'dp-1', '2026-08-17', {
        arrivalTime: '07:00',
      });

      expect(result.status).toBe(DtrDayStatus.HOLIDAY);
      expect(result.reason).toBe('Existing reason');
      expect(result.remarks).toBe('Existing remarks');
    });

    it('does not clear an existing arrival/departure when status changes to a special status', async () => {
      repository.findOne!.mockResolvedValue({
        dtrPeriodId: 'dp-1',
        date: '2026-08-17',
        status: DtrDayStatus.REGULAR,
        arrivalTime: '07:00:00',
        departureTime: '19:00:00',
      });
      repository.save!.mockImplementation((d: DtrDay) => Promise.resolve(d));

      const result = await service.update('teacher-1', 'dp-1', '2026-08-17', {
        status: DtrDayStatus.ONLINE,
      });

      expect(result.status).toBe(DtrDayStatus.ONLINE);
      expect(result.arrivalTime).toBe('07:00:00');
      expect(result.departureTime).toBe('19:00:00');
    });
  });

  describe('remove', () => {
    it('ownership-checks the DTR period, then removes the day', async () => {
      const day = { dtrPeriodId: 'dp-1', date: '2026-08-21' };
      repository.findOne!.mockResolvedValue(day);
      repository.remove!.mockResolvedValue(day);

      await service.remove('teacher-1', 'dp-1', '2026-08-21');

      expect(dtrPeriodsService.findOneForTeacher).toHaveBeenCalledWith(
        'teacher-1',
        'dp-1',
      );
      expect(repository.remove).toHaveBeenCalledWith(day);
    });

    it('throws NotFoundException when the day does not exist, and does not call remove', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(
        service.remove('teacher-1', 'dp-1', '2026-08-21'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('rejects a malformed date before touching the DB', async () => {
      await expect(
        service.remove('teacher-1', 'dp-1', 'not-a-date'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(dtrPeriodsService.findOneForTeacher).not.toHaveBeenCalled();
    });
  });
});
