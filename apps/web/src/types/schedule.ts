export const DAYS_OF_WEEK = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number]

export interface TeacherSchedule {
  id: string
  createdAt: string
  updatedAt: string
  teacherId: string
  academicPeriodId: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
}

export interface TeacherScheduleFormValues {
  academicPeriodId: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
}
