import { z } from 'zod'

export const researchResponseSchema = z.object({
  researchRequestId: z.string().uuid(),
  startupId: z.string().uuid(),
  wouldUse: z.enum(['yes', 'maybe', 'no']),
  clarityScore: z.number().int().min(1).max(5),
  problemUnderstanding: z.string().max(500).optional(),
  missingFeatures: z.string().max(500).optional(),
  frictionPoints: z.string().max(500).optional(),
  targetUserGuess: z.string().max(300).optional(),
})

export type ResearchResponseInput = z.infer<typeof researchResponseSchema>
