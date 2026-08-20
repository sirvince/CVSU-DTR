import { IsUUID } from 'class-validator';

export class QueryCalendarDto {
  @IsUUID()
  dtrPeriodId: string;
}
