import { Column, Entity, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { DayOfWeek } from '../../common/enums/day-of-week.enum';

@Entity('teacher_schedules')
@Unique(['teacherId', 'academicPeriodId', 'dayOfWeek'])
export class TeacherSchedule extends BaseEntity {
  @Column({ name: 'teacher_id' })
  teacherId: string;

  @Column({ name: 'academic_period_id' })
  academicPeriodId: string;

  @Column({ name: 'day_of_week', type: 'enum', enum: DayOfWeek })
  dayOfWeek: DayOfWeek;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;
}
