import { IsOptional, IsUUID } from 'class-validator';

export class QueryDtrPeriodDto {
  @IsOptional()
  @IsUUID()
  academicPeriodId?: string;
}
