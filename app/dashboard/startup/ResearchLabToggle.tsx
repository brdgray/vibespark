'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { FlaskConical } from 'lucide-react'

interface ResearchLabToggleProps {
  startupId: string
  startupName: string
  userId: string
  existingRequestId: string | null
  isCurrentlyActive: boolean
}

export default function ResearchLabToggle({
  startupId,
  startupName,
  userId,
  existingRequestId,
  isCurrentlyActive,
}: ResearchLabToggleProps) {
  const [isActive, setIsActive] = useState(isCurrentlyActive)
  const [requestId, setRequestId] = useState<string | null>(existingRequestId)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function toggle() {
    setLoading(true)

    if (isActive && requestId) {
      const { error } = await (supabase.from('research_requests') as any)
        .update({ is_active: false })
        .eq('id', requestId)
      if (error) { toast.error('Failed to update'); setLoading(false); return }
      setIsActive(false)
      toast.success(`${startupName} removed from Research Lab`)
    } else if (!isActive && requestId) {
      const { error } = await (supabase.from('research_requests') as any)
        .update({ is_active: true })
        .eq('id', requestId)
      if (error) { toast.error('Failed to update'); setLoading(false); return }
      setIsActive(true)
      toast.success(`${startupName} added to Research Lab!`)
    } else {
      const { data, error } = await (supabase.from('research_requests') as any)
        .insert({
          startup_id: startupId,
          title: `Feedback on ${startupName}`,
          created_by: userId,
          is_active: true,
        })
        .select('id')
        .single()
      if (error) { toast.error('Failed to activate'); setLoading(false); return }
      setRequestId(data.id)
      setIsActive(true)
      toast.success(`${startupName} is now live in the Research Lab!`)
    }
    setLoading(false)
  }

  return (
    <div className={`rounded-2xl border p-4 ${isActive ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-blue-100' : 'bg-slate-200'}`}>
            <FlaskConical className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
          </div>
          <div>
            <p className="font-medium text-sm text-slate-900">Research Lab</p>
            <p className={`mt-0.5 text-xs ${isActive ? 'text-blue-600' : 'text-muted-foreground'}`}>
              {isActive
                ? 'Your startup is listed in the Research Lab so members can leave structured feedback.'
                : 'Turn on to list this startup in the Research Lab and receive structured community feedback.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          aria-disabled={loading}
          disabled={loading}
          onClick={toggle}
          title={isActive ? 'Remove from Research Lab' : 'Add to Research Lab'}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
            isActive ? 'bg-blue-500' : 'bg-slate-300'
          } ${loading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
