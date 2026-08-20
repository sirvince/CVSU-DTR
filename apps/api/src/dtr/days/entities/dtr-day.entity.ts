import { Column, Entity, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { DtrDayStatus } from '../../../common/enums/dtr-day-status.enum';

@Entity('dtr_days')
@Unique(['dtrPeriodId', 'date'])
export class DtrDay extends BaseEntity {
  @Column({ name: 'dtr_period_id' })
  dtrPeriodId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'schedule_start_time', type: 'time', nullable: true })
  scheduleStartTime?: string;

  @Column({ name: 'schedule_end_time', type: 'time', nullable: true })
  scheduleEndTime?: string;

  @Column({ name: 'arrival_time', type: 'time', nullable: true })
  arrivalTime?: string;

  @Column({ name: 'departure_time', type: 'time', nullable: true })
  departureTime?: string;

  @Column({
    type: 'enum',
    enum: DtrDayStatus,
    default: DtrDayStatus.REGULAR,
  })
  status: DtrDayStatus;

  @Column({ nullable: true })
  reason?: string;

  @Column({ type: 'text', nullable: true })
  remarks?: string;
}
