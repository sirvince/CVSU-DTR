import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let queryBuilder: {
    leftJoinAndSelect: jest.Mock;
    where: jest.Mock;
    orderBy: jest.Mock;
    getMany: jest.Mock;
  };

  beforeEach(async () => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
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

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'user.teacherProfile',
        'profile',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith('user.role = :role', {
        role: UserRole.TEACHER,
      });
      expect(queryBuilder.getMany).toHaveBeenCalled();
    });
  });
});
