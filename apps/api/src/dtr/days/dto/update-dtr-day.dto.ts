import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { DtrDayStatus } from '../../../common/enums/dtr-day-status.enum';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class UpdateDtrDayDto {
  @IsOptional()
  @Matches(TIME_PATTERN, {
    message: 'arrivalTime must be in 24-hour HH:mm format',
  })
  arrivalTime?: string;

  @IsOptional()
  @Matches(TIME_PATTERN, {
    message: 'departureTime must be in 24-hour HH:mm format',
  })
  departureTime?: string;

  @IsOptional()
  @IsEnum(DtrDayStatus)
  status?: DtrDayStatus;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string;
}
