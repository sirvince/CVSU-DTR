import { z } from 'zod'
import { DAYS_OF_WEEK } from '@/types/schedule'

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

// Mirrors apps/api's CreateTeacherScheduleDto — see docs/api/schedules.md.
export const scheduleSchema = z
  .object({
    academicPeriodId: z.string().min(1, 'Select an academic period'),
    dayOfWeek: z.enum(DAYS_OF_WEEK),
    startTime: z.string().regex(TIME_PATTERN, 'Enter a valid time'),
    endTime: z.string().regex(TIME_PATTERN, 'Enter a valid time'),
  })
  .refine((values) => values.startTime < values.endTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  })

export type ScheduleFormSchema = z.infer<typeof scheduleSchema>
