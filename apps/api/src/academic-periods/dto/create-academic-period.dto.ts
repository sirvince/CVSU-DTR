import { IsDateString, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAcademicPeriodDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  academicYear: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  semester: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
