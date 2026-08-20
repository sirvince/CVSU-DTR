import { IsUUID } from 'class-validator';

export class GenerateDtrDto {
  @IsUUID()
  dtrPeriodId: string;
}
