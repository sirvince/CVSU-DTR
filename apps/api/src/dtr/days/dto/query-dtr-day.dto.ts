import { IsUUID } from 'class-validator';

export class QueryDtrDayDto {
  @IsUUID()
  dtrPeriodId: string;
}
