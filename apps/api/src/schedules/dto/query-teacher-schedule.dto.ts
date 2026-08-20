import { IsOptional, IsUUID } from 'class-validator';

export class QueryTeacherScheduleDto {
  @IsOptional()
  @IsUUID()
  academicPeriodId?: string;
}
