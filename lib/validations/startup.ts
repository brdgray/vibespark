import { z } from 'zod'

export const startupBasicSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  tagline: z.string().min(10, 'Tagline must be at least 10 characters').max(160),
  description: z.string().min(50, 'Description must be at least 50 characters').max(5000),
  websiteUrl: z.string().url('Please enter a valid URL'),
  categoryId: z.string().uuid('Please select a category'),
  stageId: z.string().uuid('Please select a stage'),
})

export const startupTeamSchema = z.object({
  teamMembers: z.array(z.object({
    name: z.string().min(2, 'Name is required'),
    title: z.string().optional(),
    linkedinUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    isPublic: z.boolean().default(true),
  })).min(1, 'Add at least one team member'),
})

export const startupLinksSchema = z.object({
  links: z.array(z.object({
    platform: z.string().min(1),
    url: z.string().url('Must be a valid URL'),
  })),
  foundedAt: z.string().optional(),
  location: z.string().optional(),
  teamSize: z.coerce.number().int().positive().optional(),
  pricingModel: z.enum(['free', 'freemium', 'paid', 'enterprise', 'open-source', '']).optional(),
  aiStack: z.string().optional(),
  targetAudience: z.string().max(300).optional(),
})

export const researchRequestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  prompt: z.string().max(1000).optional(),
  endsAt: z.string().optional(),
})

export const commentSchema = z.object({
  body: z.string().min(3, 'Comment must be at least 3 characters').max(2000),
  parentCommentId: z.string().uuid().optional(),
})

export const reportSchema = z.object({
  entityType: z.enum(['startup', 'comment', 'user']),
  entityId: z.string().uuid(),
  reason: z.string().min(5, 'Please provide a reason'),
  details: z.string().max(1000).optional(),
})

export type StartupBasicInput = z.infer<typeof startupBasicSchema>
export type StartupTeamInput = z.infer<typeof startupTeamSchema>
export type StartupLinksInput = z.infer<typeof startupLinksSchema>
export type ResearchRequestInput = z.infer<typeof researchRequestSchema>
export type CommentInput = z.infer<typeof commentSchema>
export type ReportInput = z.infer<typeof reportSchema>
