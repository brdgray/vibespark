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
  country: z.string().min(2, 'Country is required'),
  profession: z.string().min(1, 'Select your profession / role'),
  industry: z.string().min(1, 'Select your industry'),
  /** Comma-separated persona keys (same as profile / research_demographics.persona_type) */
  personaType: z
    .string()
    .min(1, 'Select at least one “I am a…” option')
    .refine(s => s.split(',').map(x => x.trim()).filter(Boolean).length >= 1, 'Select at least one “I am a…” option'),
  technicalLevel: z
    .string()
    .optional()
    .refine(
      v => !v || ['non-technical', 'basic', 'intermediate', 'advanced'].includes(v),
      'Invalid technical level',
    ),
})

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type DemographicsInput = z.infer<typeof demographicsSchema>
