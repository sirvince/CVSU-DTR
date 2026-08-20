import { z } from 'zod'

// Mirrors apps/api's CreateAcademicPeriodDto — see docs/api/academic-periods.md.
// startDate < endDate is enforced server-side; mirrored here so the form can
// show the error inline instead of round-tripping to the API for it.
export const academicPeriodSchema = z
  .object({
    academicYear: z.string().min(1, 'Required').max(20),
    semester: z.string().min(1, 'Required').max(50),
    startDate: z.string().min(1, 'Required'),
    endDate: z.string().min(1, 'Required'),
  })
  .refine((values) => values.startDate < values.endDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  })

export type AcademicPeriodFormSchema = z.infer<typeof academicPeriodSchema>
