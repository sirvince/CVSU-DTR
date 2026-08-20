import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeachersModule } from '../../teachers/teachers.module';
import { DtrCalendarModule } from '../calendar/dtr-calendar.module';
import { DtrPeriodsModule } from '../periods/dtr-periods.module';
import { DtrGeneratorController } from './dtr-generator.controller';
import { DtrGeneratorService } from './dtr-generator.service';
import { DtrGeneration } from './entities/dtr-generation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DtrGeneration]),
    DtrPeriodsModule,
    DtrCalendarModule,
    TeachersModule,
  ],
  controllers: [DtrGeneratorController],
  providers: [DtrGeneratorService],
  exports: [TypeOrmModule, DtrGeneratorService],
})
export class DtrGeneratorModule {}
