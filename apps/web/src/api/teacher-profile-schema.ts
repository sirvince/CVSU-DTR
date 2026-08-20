import { z } from 'zod'

// Mirrors apps/api's CreateTeacherProfileDto — see docs/api/teacher-profile.md.
const optionalUpTo100 = z
  .string()
  .max(100)
  .optional()
  .or(z.literal('').transform(() => undefined))

export const teacherProfileSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required').max(50),
  firstName: z.string().min(1, 'First name is required').max(100),
  middleName: optionalUpTo100,
  lastName: z.string().min(1, 'Last name is required').max(100),
  position: optionalUpTo100,
  department: optionalUpTo100,
  campus: optionalUpTo100,
})

export type TeacherProfileFormSchema = z.infer<typeof teacherProfileSchema>
