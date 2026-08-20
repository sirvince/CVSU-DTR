import { Column, Entity, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('dtr_periods')
@Unique(['teacherId', 'academicPeriodId', 'startDate', 'endDate'])
export class DtrPeriod extends BaseEntity {
  @Column({ name: 'teacher_id' })
  teacherId: string;

  @Column({ name: 'academic_period_id' })
  academicPeriodId: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ nullable: true })
  label?: string;
}
