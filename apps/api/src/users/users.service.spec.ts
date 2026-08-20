import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let queryBuilder: {
    leftJoin: jest.Mock;
    select: jest.Mock;
    addSelect: jest.Mock;
    where: jest.Mock;
    orderBy: jest.Mock;
    getMany: jest.Mock;
  };

  beforeEach(async () => {
    queryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('findAllTeachersWithProfiles', () => {
    it('left-joins teacherProfile and filters to TEACHER role only', async () => {
      await service.findAllTeachersWithProfiles();

      expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
        'user.teacherProfile',
        'profile',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith('user.role = :role', {
        role: UserRole.TEACHER,
      });
      expect(queryBuilder.getMany).toHaveBeenCalled();
    });

    it('never selects user.passwordHash', async () => {
      await service.findAllTeachersWithProfiles();

      const selectedColumns: string[] = [
        ...(queryBuilder.select.mock.calls.flat(2) as string[]),
        ...(queryBuilder.addSelect.mock.calls.flat(2) as string[]),
      ];
      expect(selectedColumns).not.toContain('user.passwordHash');
      expect(selectedColumns).toContain('user.email');
      expect(selectedColumns).toContain('profile.employeeId');
    });
  });
});
