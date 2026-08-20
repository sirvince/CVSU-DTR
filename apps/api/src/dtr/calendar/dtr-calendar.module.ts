import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulesModule } from '../../schedules/schedules.module';
import { DtrDay } from '../days/entities/dtr-day.entity';
import { DtrPeriodsModule } from '../periods/dtr-periods.module';
import { DtrCalendarController } from './dtr-calendar.controller';
import { DtrCalendarService } from './dtr-calendar.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DtrDay]),
    DtrPeriodsModule,
    SchedulesModule,
  ],
  controllers: [DtrCalendarController],
  providers: [DtrCalendarService],
  exports: [DtrCalendarService],
})
export class DtrCalendarModule {}
