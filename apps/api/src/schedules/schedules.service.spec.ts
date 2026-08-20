import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { AcademicPeriodsService } from '../academic-periods/academic-periods.service';
import { DayOfWeek } from '../common/enums/day-of-week.enum';
import { SchedulesService } from './schedules.service';
import { TeacherSchedule } from './entities/teacher-schedule.entity';

type MockRepository = Partial<
  Record<keyof Repository<TeacherSchedule>, jest.Mock>
>;

const createMockRepository = (): MockRepository => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('SchedulesService', () => {
  let service: SchedulesService;
  let repository: MockRepository;
  let academicPeriodsService: { findOneForTeacher: jest.Mock };

  beforeEach(async () => {
    academicPeriodsService = { findOneForTeacher: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        {
          provide: getRepositoryToken(TeacherSchedule),
          useValue: createMockRepository(),
        },
        {
          provide: AcademicPeriodsService,
          useValue: academicPeriodsService,
        },
      ],
    }).compile();

    service = module.get(SchedulesService);
    repository = module.get(getRepositoryToken(TeacherSchedule));
  });

  const dto = {
    academicPeriodId: 'period-1',
    dayOfWeek: DayOfWeek.MONDAY,
    startTime: '07:00',
    endTime: '19:00',
  };

  describe('findAllForTeacher', () => {
    it('scopes the query to the teacher only when no academicPeriodId given', async () => {
      repository.find!.mockResolvedValue([]);

      await service.findAllForTeacher('teacher-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { teacherId: 'teacher-1' },
        order: { dayOfWeek: 'ASC' },
      });
    });

    it('also filters by academicPeriodId when given', async () => {
      repository.find!.mockResolvedValue([]);

      await service.findAllForTeacher('teacher-1', 'period-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { teacherId: 'teacher-1', academicPeriodId: 'period-1' },
        order: { dayOfWeek: 'ASC' },
      });
    });
  });

  describe('create', () => {
    it('rejects when the academic period is not owned by the teacher', async () => {
      academicPeriodsService.findOneForTeacher.mockRejectedValue(
        new NotFoundException('Academic period not found'),
      );

      await expect(service.create('teacher-1', dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('rejects when startTime is not before endTime', async () => {
      academicPeriodsService.findOneForTeacher.mockResolvedValue({
        id: 'period-1',
      });

      await expect(
        service.create('teacher-1', {
          ...dto,
          startTime: '19:00',
          endTime: '07:00',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('creates the schedule scoped to the teacher once ownership is confirmed', async () => {
      academicPeriodsService.findOneForTeacher.mockResolvedValue({
        id: 'period-1',
      });
      const created = { ...dto, teacherId: 'teacher-1' };
      repository.create!.mockReturnValue(created);
      repository.save!.mockResolvedValue(created);

      await expect(service.create('teacher-1', dto)).resolves.toBe(created);
      expect(academicPeriodsService.findOneForTeacher).toHaveBeenCalledWith(
        'teacher-1',
        'period-1',
      );
      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        startTime: '07:00:00',
        endTime: '19:00:00',
        teacherId: 'teacher-1',
      });
    });

    it('translates a duplicate day/period DB error into ConflictException', async () => {
      academicPeriodsService.findOneForTeacher.mockResolvedValue({
        id: 'period-1',
      });
      repository.create!.mockReturnValue({ ...dto, teacherId: 'teacher-1' });
      repository.save!.mockRejectedValue({ code: 'ER_DUP_ENTRY' });

      await expect(service.create('teacher-1', dto)).rejects.toMatchObject({
        status: 409,
      });
    });
  });

  describe('update', () => {
    it('re-validates ownership only when academicPeriodId actually changes', async () => {
      const existing = { id: 'sched-1', teacherId: 'teacher-1', ...dto };
      repository.findOne!.mockResolvedValue(existing);
      repository.save!.mockImplementation((s: TeacherSchedule) =>
        Promise.resolve(s),
      );

      await service.update('teacher-1', 'sched-1', { startTime: '08:00' });

      expect(academicPeriodsService.findOneForTeacher).not.toHaveBeenCalled();
    });

    it('re-validates ownership when academicPeriodId changes', async () => {
      const existing = { id: 'sched-1', teacherId: 'teacher-1', ...dto };
      repository.findOne!.mockResolvedValue(existing);
      academicPeriodsService.findOneForTeacher.mockResolvedValue({
        id: 'period-2',
      });
      repository.save!.mockImplementation((s: TeacherSchedule) =>
        Promise.resolve(s),
      );

      await service.update('teacher-1', 'sched-1', {
        academicPeriodId: 'period-2',
      });

      expect(academicPeriodsService.findOneForTeacher).toHaveBeenCalledWith(
        'teacher-1',
        'period-2',
      );
    });

    it('rejects an update that makes the time range invalid', async () => {
      const existing = { id: 'sched-1', teacherId: 'teacher-1', ...dto };
      repository.findOne!.mockResolvedValue(existing);

      await expect(
        service.update('teacher-1', 'sched-1', { startTime: '20:00' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when removing a schedule not owned by the teacher', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(
        service.remove('teacher-1', 'sched-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
