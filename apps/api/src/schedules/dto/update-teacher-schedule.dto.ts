import { PartialType } from '@nestjs/mapped-types';
import { CreateTeacherScheduleDto } from './create-teacher-schedule.dto';

export class UpdateTeacherScheduleDto extends PartialType(
  CreateTeacherScheduleDto,
) {}
