import { Module } from '@nestjs/common';
import { DtrCalendarModule } from '../calendar/dtr-calendar.module';
import { DtrValidationController } from './dtr-validation.controller';
import { DtrValidationService } from './dtr-validation.service';

@Module({
  imports: [DtrCalendarModule],
  controllers: [DtrValidationController],
  providers: [DtrValidationService],
  exports: [DtrValidationService],
})
export class DtrValidationModule {}
