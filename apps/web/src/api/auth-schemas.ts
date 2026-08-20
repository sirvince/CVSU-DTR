import { z } from 'zod'

// Mirrors apps/api's RegisterDto/LoginDto validation exactly — see docs/api/auth.md.
export const credentialsSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type CredentialsFormValues = z.infer<typeof credentialsSchema>
