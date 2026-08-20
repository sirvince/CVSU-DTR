import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { AcademicPeriodsService } from './academic-periods.service';
import { AcademicPeriod } from './entities/academic-period.entity';

type MockRepository = Partial<
  Record<keyof Repository<AcademicPeriod>, jest.Mock>
>;

const createMockRepository = (): MockRepository => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('AcademicPeriodsService', () => {
  let service: AcademicPeriodsService;
  let repository: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicPeriodsService,
        {
          provide: getRepositoryToken(AcademicPeriod),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get(AcademicPeriodsService);
    repository = module.get(getRepositoryToken(AcademicPeriod));
  });

  const dto = {
    academicYear: '2026-2027',
    semester: '1st Semester',
    startDate: '2026-08-01',
    endDate: '2027-01-31',
  };

  // Shared resource: no teacher-scoping in any of these anymore — every
  // authenticated teacher reads the same list, only an ADMIN (enforced by
  // RolesGuard at the controller, not here) can write.
  describe('findAll', () => {
    it('returns every period, ordered by startDate desc', async () => {
      repository.find!.mockResolvedValue([]);

      await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        order: { startDate: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when no matching row exists', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('period-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'period-1' },
      });
    });

    it('returns the period when found', async () => {
      const period = { id: 'period-1' };
      repository.findOne!.mockResolvedValue(period);

      await expect(service.findOne('period-1')).resolves.toBe(period);
    });
  });

  describe('create', () => {
    it('rejects when startDate is not before endDate', async () => {
      await expect(
        service.create('admin-1', {
          ...dto,
          startDate: '2027-01-31',
          endDate: '2026-08-01',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('creates the period, stamping createdByUserId for audit only', async () => {
      const created = { ...dto, createdByUserId: 'admin-1' };
      repository.create!.mockReturnValue(created);
      repository.save!.mockResolvedValue(created);

      await expect(service.create('admin-1', dto)).resolves.toBe(created);
      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        createdByUserId: 'admin-1',
      });
    });

    it('translates a duplicate year/semester DB error into ConflictException', async () => {
      repository.create!.mockReturnValue({
        ...dto,
        createdByUserId: 'admin-1',
      });
      repository.save!.mockRejectedValue({ code: 'ER_DUP_ENTRY' });

      await expect(service.create('admin-1', dto)).rejects.toMatchObject({
        status: 409,
      });
    });
  });

  describe('update', () => {
    it('merges changes, re-validates the date range, and saves', async () => {
      const existing = { id: 'period-1', ...dto };
      repository.findOne!.mockResolvedValue(existing);
      repository.save!.mockImplementation((p: AcademicPeriod) =>
        Promise.resolve(p),
      );

      const result = await service.update('period-1', {
        semester: '2nd Semester',
      });

      expect(result.semester).toBe('2nd Semester');
    });

    it('rejects an update that makes the date range invalid', async () => {
      const existing = { id: 'period-1', ...dto };
      repository.findOne!.mockResolvedValue(existing);

      await expect(
        service.update('period-1', { startDate: '2027-06-01' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when the period does not exist', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.remove('period-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('removes the period when found', async () => {
      const existing = { id: 'period-1' };
      repository.findOne!.mockResolvedValue(existing);
      repository.remove!.mockResolvedValue(existing);

      await service.remove('period-1');

      expect(repository.remove).toHaveBeenCalledWith(existing);
    });
  });
});
