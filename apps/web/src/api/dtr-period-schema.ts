import { z } from 'zod'

// Mirrors apps/api's CreateDtrPeriodDto — see docs/api/dtr-periods.md. The
// "must fall within the parent academic period" and "must be a single
// calendar month" (needed later for Excel generation) rules aren't checked
// here — they need the academic period's own dates, so the backend's error
// message is surfaced on submit instead of duplicating that logic client-side.
export const dtrPeriodSchema = z
  .object({
    academicPeriodId: z.string().min(1, 'Select an academic period'),
    startDate: z.string().min(1, 'Required'),
    endDate: z.string().min(1, 'Required'),
    label: z.string().max(100).optional().or(z.literal('').transform(() => undefined)),
  })
  .refine((values) => values.startDate < values.endDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  })

export type DtrPeriodFormSchema = z.infer<typeof dtrPeriodSchema>
