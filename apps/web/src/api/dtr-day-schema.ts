import { z } from 'zod'
import { DTR_DAY_STATUSES } from '@/types/dtr-day'

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/
const optionalTime = z
  .string()
  .regex(TIME_PATTERN, 'Enter a valid time')
  .optional()
  .or(z.literal('').transform(() => undefined))

// Mirrors apps/api's UpdateDtrDayDto — see docs/api/dtr-days.md. Status
// changing does NOT clear arrival/departure server-side, and this form
// doesn't either — see CLAUDE.md's "no auto-clear" note.
export const dtrDaySchema = z
  .object({
    arrivalTime: optionalTime,
    departureTime: optionalTime,
    status: z.enum(DTR_DAY_STATUSES),
    reason: z
      .string()
      .max(255)
      .optional()
      .or(z.literal('').transform(() => undefined)),
    remarks: z
      .string()
      .max(2000)
      .optional()
      .or(z.literal('').transform(() => undefined)),
  })
  .refine(
    (values) => !values.arrivalTime || !values.departureTime || values.arrivalTime < values.departureTime,
    { message: 'Arrival must be earlier than departure', path: ['departureTime'] },
  )

export type DtrDayFormSchema = z.infer<typeof dtrDaySchema>
