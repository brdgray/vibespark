import { z } from 'zod'

const score1to10 = z.number().int().min(1).max(10)

export const researchResponseSchema = z.object({
  researchRequestId: z.string().uuid(),
  startupId: z.string().uuid(),
  wouldUse: z.enum(['yes', 'maybe', 'no']),
  clarityScore: z.number().int().min(1).max(5),
  usabilityScore: score1to10,
  scalabilityScore: score1to10,
  valueClarityScore: score1to10,
  desirabilityScore: score1to10,
  trustScore: score1to10,
  problemUnderstanding: z.string().max(500).optional(),
  missingFeatures: z.string().max(500).optional(),
  frictionPoints: z.string().max(500).optional(),
  targetUserGuess: z.string().max(300).optional(),
})

export type ResearchResponseInput = z.infer<typeof researchResponseSchema>
