'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { researchRequestSchema, type ResearchRequestInput } from '@/lib/validations/startup'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ResearchRequestFormProps {
  startupId: string
  userId: string
}

export default function ResearchRequestForm({ startupId, userId }: ResearchRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ResearchRequestInput>({
    resolver: zodResolver(researchRequestSchema),
  })

  async function onSubmit(data: ResearchRequestInput) {
    setIsSubmitting(true)
    const { error } = await (supabase.from('research_requests') as any).insert({
      startup_id: startupId,
      title: data.title,
      prompt: data.prompt || null,
      ends_at: data.endsAt || null,
      created_by: userId,
      is_active: true,
    })
    if (error) {
      toast.error('Failed to create research request')
    } else {
      toast.success('Research request created! Your startup will now appear in the Research Lab.')
      reset()
      router.refresh()
    }
    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Request Title *</Label>
        <Input placeholder="e.g. 'Is the value proposition clear?'" {...register('title')} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Specific Question or Prompt (optional)</Label>
        <Textarea
          rows={2}
          placeholder="What specific feedback are you looking for from the community?"
          {...register('prompt')}
        />
      </div>
      <div className="space-y-1.5">
        <Label>End Date (optional)</Label>
        <Input type="datetime-local" {...register('endsAt')} />
      </div>
      <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Research Request'}
      </Button>
    </form>
  )
}
