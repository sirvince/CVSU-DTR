import { Module } from '@nestjs/common';
import { DtrCalendarModule } from './calendar/dtr-calendar.module';
import { DtrDaysModule } from './days/dtr-days.module';
import { DtrGeneratorModule } from './generator/dtr-generator.module';
import { DtrPeriodsModule } from './periods/dtr-periods.module';
import { DtrValidationModule } from './validation/dtr-validation.module';

@Module({
  imports: [
    DtrPeriodsModule,
    DtrDaysModule,
    DtrCalendarModule,
    DtrValidationModule,
    DtrGeneratorModule,
  ],
  exports: [
    DtrPeriodsModule,
    DtrDaysModule,
    DtrCalendarModule,
    DtrValidationModule,
    DtrGeneratorModule,
  ],
})
export class DtrModule {}
