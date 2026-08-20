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

  describe('findAllForTeacher', () => {
    it('scopes the query to the given teacher', async () => {
      repository.find!.mockResolvedValue([]);

      await service.findAllForTeacher('teacher-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { teacherId: 'teacher-1' },
        order: { startDate: 'DESC' },
      });
    });
  });

  describe('findOneForTeacher', () => {
    it('throws NotFoundException when no matching row for that teacher exists', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(
        service.findOneForTeacher('teacher-1', 'period-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'period-1', teacherId: 'teacher-1' },
      });
    });

    it('returns the period when owned by the teacher', async () => {
      const period = { id: 'period-1', teacherId: 'teacher-1' };
      repository.findOne!.mockResolvedValue(period);

      await expect(
        service.findOneForTeacher('teacher-1', 'period-1'),
      ).resolves.toBe(period);
    });
  });

  describe('create', () => {
    it('rejects when startDate is not before endDate', async () => {
      await expect(
        service.create('teacher-1', {
          ...dto,
          startDate: '2027-01-31',
          endDate: '2026-08-01',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('creates the period scoped to the teacher', async () => {
      const created = { ...dto, teacherId: 'teacher-1' };
      repository.create!.mockReturnValue(created);
      repository.save!.mockResolvedValue(created);

      await expect(service.create('teacher-1', dto)).resolves.toBe(created);
      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        teacherId: 'teacher-1',
      });
    });

    it('translates a duplicate year/semester DB error into ConflictException', async () => {
      repository.create!.mockReturnValue({ ...dto, teacherId: 'teacher-1' });
      repository.save!.mockRejectedValue({ code: 'ER_DUP_ENTRY' });

      await expect(service.create('teacher-1', dto)).rejects.toMatchObject({
        status: 409,
      });
    });
  });

  describe('update', () => {
    it('merges changes, re-validates the date range, and saves', async () => {
      const existing = { id: 'period-1', teacherId: 'teacher-1', ...dto };
      repository.findOne!.mockResolvedValue(existing);
      repository.save!.mockImplementation((p: AcademicPeriod) =>
        Promise.resolve(p),
      );

      const result = await service.update('teacher-1', 'period-1', {
        semester: '2nd Semester',
      });

      expect(result.semester).toBe('2nd Semester');
    });

    it('rejects an update that makes the date range invalid', async () => {
      const existing = { id: 'period-1', teacherId: 'teacher-1', ...dto };
      repository.findOne!.mockResolvedValue(existing);

      await expect(
        service.update('teacher-1', 'period-1', { startDate: '2027-06-01' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when removing a period not owned by the teacher', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(
        service.remove('teacher-1', 'period-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('removes the period when owned by the teacher', async () => {
      const existing = { id: 'period-1', teacherId: 'teacher-1' };
      repository.findOne!.mockResolvedValue(existing);
      repository.remove!.mockResolvedValue(existing);

      await service.remove('teacher-1', 'period-1');

      expect(repository.remove).toHaveBeenCalledWith(existing);
    });
  });
});
