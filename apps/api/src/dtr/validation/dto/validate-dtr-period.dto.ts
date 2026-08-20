import { IsUUID } from 'class-validator';

export class ValidateDtrPeriodDto {
  @IsUUID()
  dtrPeriodId: string;
}
