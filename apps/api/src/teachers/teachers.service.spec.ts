import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { TeacherProfile } from './entities/teacher-profile.entity';
import { TeachersService } from './teachers.service';

type MockRepository = Partial<
  Record<keyof Repository<TeacherProfile>, jest.Mock>
>;

const createMockRepository = (): MockRepository => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('TeachersService', () => {
  let service: TeachersService;
  let repository: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeachersService,
        {
          provide: getRepositoryToken(TeacherProfile),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get(TeachersService);
    repository = module.get(getRepositoryToken(TeacherProfile));
  });

  describe('findByUserId', () => {
    it('returns the profile when it exists', async () => {
      const profile = { id: '1', userId: 'user-1' } as TeacherProfile;
      repository.findOne!.mockResolvedValue(profile);

      await expect(service.findByUserId('user-1')).resolves.toBe(profile);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('throws NotFoundException when no profile exists', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findByUserId('user-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const dto = {
      employeeId: 'EMP-1',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('creates a profile when none exists for the user', async () => {
      repository.findOne!.mockResolvedValue(null);
      const created = { ...dto, userId: 'user-1' };
      repository.create!.mockReturnValue(created);
      repository.save!.mockResolvedValue(created);

      await expect(service.create('user-1', dto)).resolves.toBe(created);
      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        userId: 'user-1',
      });
    });

    it('throws ConflictException when a profile already exists for the user', async () => {
      repository.findOne!.mockResolvedValue({ id: 'existing' });

      await expect(service.create('user-1', dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('translates a duplicate employeeId DB error into ConflictException', async () => {
      repository.findOne!.mockResolvedValue(null);
      repository.create!.mockReturnValue({ ...dto, userId: 'user-1' });
      repository.save!.mockRejectedValue({ code: 'ER_DUP_ENTRY' });

      await expect(service.create('user-1', dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('merges changes into the existing profile and saves it', async () => {
      const existing = {
        id: '1',
        userId: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
      } as TeacherProfile;
      repository.findOne!.mockResolvedValue(existing);
      repository.save!.mockImplementation((p: TeacherProfile) =>
        Promise.resolve(p),
      );

      const result = await service.update('user-1', { firstName: 'Jane' });

      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Doe');
    });

    it('throws NotFoundException when updating a profile that does not exist', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(
        service.update('user-1', { firstName: 'Jane' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
