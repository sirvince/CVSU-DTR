import { IsEnum, IsUUID, Matches } from 'class-validator';
import { DayOfWeek } from '../../common/enums/day-of-week.enum';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateTeacherScheduleDto {
  @IsUUID()
  academicPeriodId: string;

  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @Matches(TIME_PATTERN, {
    message: 'startTime must be in 24-hour HH:mm format',
  })
  startTime: string;

  @Matches(TIME_PATTERN, {
    message: 'endTime must be in 24-hour HH:mm format',
  })
  endTime: string;
}
