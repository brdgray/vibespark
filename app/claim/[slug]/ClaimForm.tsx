'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'

interface ClaimFormProps {
  startupId: string
  startupSlug: string
  userId: string
}

export default function ClaimForm({ startupId, startupSlug, userId }: ClaimFormProps) {
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    const { error } = await (supabase.from('startup_claim_requests') as any).insert({
      startup_id: startupId,
      user_id: userId,
      notes: notes || null,
    })
    if (error) {
      toast.error('Failed to submit claim request')
    } else {
      setSubmitted(true)
    }
    setIsSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="space-y-4">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
        <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-sm text-green-700">
          Claim request submitted! Our team will review it and get back to you within 1-3 business days.
        </div>
        <Button variant="outline" onClick={() => router.push(`/startups/${startupSlug}`)}>
          Back to Startup Profile
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
        To claim this startup, you need to verify that you are the founder or an authorized representative.
        Our team will review your request and may reach out for verification.
      </div>
      <div className="space-y-1.5">
        <Label>Notes (optional)</Label>
        <Textarea
          placeholder="e.g. 'I am the CEO and co-founder. You can verify by emailing founder@startup.com' or 'Check our LinkedIn page at...'"
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Claim Request'}
      </Button>
    </form>
  )
}
