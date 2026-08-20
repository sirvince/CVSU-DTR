import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { TeachersService } from '../../teachers/teachers.service';
import { DtrCalendarService } from '../calendar/dtr-calendar.service';
import { DtrPeriodsService } from '../periods/dtr-periods.service';
import { DtrGeneratorService } from './dtr-generator.service';
import { DtrGeneration } from './entities/dtr-generation.entity';

jest.mock('node:fs/promises', () => ({
  access: jest.fn(),
  mkdir: jest.fn(),
}));

import { access } from 'node:fs/promises';

type MockRepository = Partial<
  Record<keyof Repository<DtrGeneration>, jest.Mock>
>;

const createMockRepository = (): MockRepository => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  count: jest.fn(),
});

describe('DtrGeneratorService', () => {
  let service: DtrGeneratorService;
  let repository: MockRepository;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DtrGeneratorService,
        {
          provide: getRepositoryToken(DtrGeneration),
          useValue: createMockRepository(),
        },
        { provide: DtrPeriodsService, useValue: {} },
        { provide: DtrCalendarService, useValue: {} },
        { provide: TeachersService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get(DtrGeneratorService);
    repository = module.get(getRepositoryToken(DtrGeneration));
  });

  describe('findGenerationForTeacher', () => {
    it('throws NotFoundException when no generation matches for that teacher', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(
        service.findGenerationForTeacher('teacher-1', 'gen-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'gen-1', teacherId: 'teacher-1' },
      });
    });

    it('returns the generation when owned by the teacher', async () => {
      const generation = { id: 'gen-1', teacherId: 'teacher-1' };
      repository.findOne!.mockResolvedValue(generation);

      await expect(
        service.findGenerationForTeacher('teacher-1', 'gen-1'),
      ).resolves.toBe(generation);
    });
  });

  describe('resolveDownload', () => {
    it('throws NotFoundException when the file no longer exists on disk', async () => {
      repository.findOne!.mockResolvedValue({
        id: 'gen-1',
        teacherId: 'teacher-1',
        filePath: 'storage/generated/missing.xlsx',
        fileName: 'DTR_DALLEGO_JOHN-VINCENT_AUG-16-31-2026.xlsx',
      });
      (access as jest.Mock).mockRejectedValue(new Error('ENOENT'));

      await expect(
        service.resolveDownload('teacher-1', 'gen-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the resolved absolute path and display filename when the file exists', async () => {
      repository.findOne!.mockResolvedValue({
        id: 'gen-1',
        teacherId: 'teacher-1',
        filePath: 'storage/generated/real.xlsx',
        fileName: 'DTR_DALLEGO_JOHN-VINCENT_AUG-16-31-2026.xlsx',
      });
      (access as jest.Mock).mockResolvedValue(undefined);

      const result = await service.resolveDownload('teacher-1', 'gen-1');

      expect(result.fileName).toBe(
        'DTR_DALLEGO_JOHN-VINCENT_AUG-16-31-2026.xlsx',
      );
      expect(result.filePath.endsWith('real.xlsx')).toBe(true);
    });

    it('propagates ownership 404 without ever checking the filesystem', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(
        service.resolveDownload('teacher-1', 'gen-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(access).not.toHaveBeenCalled();
    });
  });
});
