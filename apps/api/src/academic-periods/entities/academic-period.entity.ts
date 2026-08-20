import { Column, Entity, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('academic_periods')
@Unique(['teacherId', 'academicYear', 'semester'])
export class AcademicPeriod extends BaseEntity {
  @Column({ name: 'teacher_id' })
  teacherId: string;

  @Column({ name: 'academic_year' })
  academicYear: string;

  @Column()
  semester: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;
}
