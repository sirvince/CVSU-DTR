import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicPeriodsModule } from '../../academic-periods/academic-periods.module';
import { DtrPeriod } from './entities/dtr-period.entity';
import { DtrPeriodsController } from './dtr-periods.controller';
import { DtrPeriodsService } from './dtr-periods.service';

@Module({
  imports: [TypeOrmModule.forFeature([DtrPeriod]), AcademicPeriodsModule],
  controllers: [DtrPeriodsController],
  providers: [DtrPeriodsService],
  exports: [TypeOrmModule, DtrPeriodsService],
})
export class DtrPeriodsModule {}
