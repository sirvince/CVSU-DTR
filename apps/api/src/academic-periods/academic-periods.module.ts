import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicPeriodsController } from './academic-periods.controller';
import { AcademicPeriodsService } from './academic-periods.service';
import { AcademicPeriod } from './entities/academic-period.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AcademicPeriod])],
  controllers: [AcademicPeriodsController],
  providers: [AcademicPeriodsService],
  exports: [TypeOrmModule, AcademicPeriodsService],
})
export class AcademicPeriodsModule {}
