import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { AcademicPeriodsService } from '../../academic-periods/academic-periods.service';
import { DtrPeriodsService } from './dtr-periods.service';
import { DtrPeriod } from './entities/dtr-period.entity';

type MockRepository = Partial<Record<keyof Repository<DtrPeriod>, jest.Mock>>;

const createMockRepository = (): MockRepository => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('DtrPeriodsService', () => {
  let service: DtrPeriodsService;
  let repository: MockRepository;
  let academicPeriodsService: { findOne: jest.Mock };

  const academicPeriod = {
    id: 'ap-1',
    startDate: '2026-08-01',
    endDate: '2027-01-31',
  };

  beforeEach(async () => {
    academicPeriodsService = {
      findOne: jest.fn().mockResolvedValue(academicPeriod),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DtrPeriodsService,
        {
          provide: getRepositoryToken(DtrPeriod),
          useValue: createMockRepository(),
        },
        {
          provide: AcademicPeriodsService,
          useValue: academicPeriodsService,
        },
      ],
    }).compile();

    service = module.get(DtrPeriodsService);
    repository = module.get(getRepositoryToken(DtrPeriod));
  });

  const dto = {
    academicPeriodId: 'ap-1',
    startDate: '2026-08-16',
    endDate: '2026-08-31',
    label: 'August 16-31',
  };

  describe('findAllForTeacher', () => {
    it('scopes the query to the teacher and optional academicPeriodId', async () => {
      repository.find!.mockResolvedValue([]);

      await service.findAllForTeacher('teacher-1', 'ap-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { teacherId: 'teacher-1', academicPeriodId: 'ap-1' },
        order: { startDate: 'DESC' },
      });
    });
  });

  describe('create', () => {
    it('rejects when the academic period does not exist', async () => {
      academicPeriodsService.findOne.mockRejectedValue(
        new NotFoundException('Academic period not found'),
      );

      await expect(service.create('teacher-1', dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('rejects when startDate is not before endDate', async () => {
      await expect(
        service.create('teacher-1', {
          ...dto,
          startDate: '2026-08-31',
          endDate: '2026-08-16',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('rejects when the range falls outside the academic period', async () => {
      await expect(
        service.create('teacher-1', {
          ...dto,
          startDate: '2027-02-01',
          endDate: '2027-02-15',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('creates the period once ownership and range checks pass', async () => {
      const created = { ...dto, teacherId: 'teacher-1' };
      repository.create!.mockReturnValue(created);
      repository.save!.mockResolvedValue(created);

      await expect(service.create('teacher-1', dto)).resolves.toBe(created);
      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        teacherId: 'teacher-1',
      });
    });

    it('translates a duplicate date-range DB error into ConflictException', async () => {
      repository.create!.mockReturnValue({ ...dto, teacherId: 'teacher-1' });
      repository.save!.mockRejectedValue({ code: 'ER_DUP_ENTRY' });

      await expect(service.create('teacher-1', dto)).rejects.toMatchObject({
        status: 409,
      });
    });
  });

  describe('update', () => {
    it('rejects an update that falls outside the academic period', async () => {
      const existing = { id: 'dp-1', teacherId: 'teacher-1', ...dto };
      repository.findOne!.mockResolvedValue(existing);

      await expect(
        service.update('teacher-1', 'dp-1', { endDate: '2027-02-15' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('re-checks the academic period exists when academicPeriodId changes', async () => {
      const existing = { id: 'dp-1', teacherId: 'teacher-1', ...dto };
      repository.findOne!.mockResolvedValue(existing);
      repository.save!.mockImplementation((p: DtrPeriod) => Promise.resolve(p));

      await service.update('teacher-1', 'dp-1', {
        academicPeriodId: 'ap-2',
      });

      expect(academicPeriodsService.findOne).toHaveBeenCalledWith('ap-2');
    });

    it('merges changes and saves when everything is valid', async () => {
      const existing = { id: 'dp-1', teacherId: 'teacher-1', ...dto };
      repository.findOne!.mockResolvedValue(existing);
      repository.save!.mockImplementation((p: DtrPeriod) => Promise.resolve(p));

      const result = await service.update('teacher-1', 'dp-1', {
        label: 'Updated label',
      });

      expect(result.label).toBe('Updated label');
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when removing a period not owned by the teacher', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.remove('teacher-1', 'dp-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
