import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  accountType: z.enum(['user', 'startup_owner']),
})

export const demographicsSchema = z.object({
  ageRange: z.enum(['under-18', '18-24', '25-34', '35-44', '45-54', '55+']),
  gender: z.string().optional(),
  country: z.string().min(2, 'Please select your country'),
  profession: z.string().min(2, 'Please enter your profession'),
  industry: z.string().min(2, 'Please select your industry'),
  personaType: z.enum(['founder', 'employee', 'student', 'consumer', 'investor']),
  technicalLevel: z.enum(['non-technical', 'basic', 'intermediate', 'advanced']).optional(),
})

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type DemographicsInput = z.infer<typeof demographicsSchema>
