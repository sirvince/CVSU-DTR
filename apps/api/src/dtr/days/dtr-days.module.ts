import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DtrPeriodsModule } from '../periods/dtr-periods.module';
import { DtrDaysController } from './dtr-days.controller';
import { DtrDaysService } from './dtr-days.service';
import { DtrDay } from './entities/dtr-day.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DtrDay]), DtrPeriodsModule],
  controllers: [DtrDaysController],
  providers: [DtrDaysService],
  exports: [TypeOrmModule, DtrDaysService],
})
export class DtrDaysModule {}
