import { IsUUID } from 'class-validator';

export class GenerateCalendarDto {
  @IsUUID()
  dtrPeriodId: string;
}
