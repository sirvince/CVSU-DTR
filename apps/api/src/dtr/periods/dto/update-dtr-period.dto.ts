import { PartialType } from '@nestjs/mapped-types';
import { CreateDtrPeriodDto } from './create-dtr-period.dto';

export class UpdateDtrPeriodDto extends PartialType(CreateDtrPeriodDto) {}
