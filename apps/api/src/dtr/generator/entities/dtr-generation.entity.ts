import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('dtr_generations')
export class DtrGeneration extends BaseEntity {
  @Column({ name: 'teacher_id' })
  teacherId: string;

  @Column({ name: 'dtr_period_id' })
  dtrPeriodId: string;

  @Column({ default: 1 })
  version: number;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'file_path' })
  filePath: string;

  @Column({ name: 'generated_at', type: 'timestamp' })
  generatedAt: Date;
}
