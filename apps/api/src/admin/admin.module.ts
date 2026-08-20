import { Module } from '@nestjs/common';
import { DtrGeneratorModule } from '../dtr/generator/dtr-generator.module';
import { DtrPeriodsModule } from '../dtr/periods/dtr-periods.module';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [UsersModule, DtrPeriodsModule, DtrGeneratorModule],
  controllers: [AdminController],
})
export class AdminModule {}
