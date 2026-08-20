import { Column, Entity, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

// Shared, admin-managed resource — every teacher reads the same list (see
// academic-periods.service.ts). createdByUserId is audit-only (which admin
// created it), not an ownership/scoping field, so it's nullable and never
// appears in a WHERE clause.
@Entity('academic_periods')
@Unique(['academicYear', 'semester'])
export class AcademicPeriod extends BaseEntity {
  @Column({ name: 'created_by_user_id', type: 'varchar', nullable: true })
  createdByUserId: string | null;

  @Column({ name: 'academic_year' })
  academicYear: string;

  @Column()
  semester: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;
}
