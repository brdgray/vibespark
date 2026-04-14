'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { FlaskConical, Lock } from 'lucide-react'
import { LinkButton } from '@/components/ui/link-button'

interface ResearchLabToggleProps {
  startupId: string
  startupName: string
  userId: string
  existingRequestId: string | null
  isCurrentlyActive: boolean
  feedbackGivenCount: number
}

const REQUIRED_FEEDBACKS = 3

export default function ResearchLabToggle({
  startupId,
  startupName,
  userId,
  existingRequestId,
  isCurrentlyActive,
  feedbackGivenCount,
}: ResearchLabToggleProps) {
  const [isActive, setIsActive] = useState(isCurrentlyActive)
  const [requestId, setRequestId] = useState<string | null>(existingRequestId)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const hasEnoughFeedback = feedbackGivenCount >= REQUIRED_FEEDBACKS
  const remaining = REQUIRED_FEEDBACKS - feedbackGivenCount

  async function toggle() {
    if (!hasEnoughFeedback) return
    setLoading(true)

    if (isActive && requestId) {
      // Deactivate
      const { error } = await (supabase.from('research_requests') as any)
        .update({ is_active: false })
        .eq('id', requestId)
      if (error) { toast.error('Failed to update'); setLoading(false); return }
      setIsActive(false)
      toast.success(`${startupName} removed from Research Lab`)
    } else if (!isActive && requestId) {
      // Reactivate existing
      const { error } = await (supabase.from('research_requests') as any)
        .update({ is_active: true })
        .eq('id', requestId)
      if (error) { toast.error('Failed to update'); setLoading(false); return }
      setIsActive(true)
      toast.success(`${startupName} added to Research Lab!`)
    } else {
      // Create new
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
          <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-blue-100' : 'bg-slate-200'}`}>
            {hasEnoughFeedback ? (
              <FlaskConical className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
            ) : (
              <Lock className="h-4 w-4 text-slate-400" />
            )}
          </div>
          <div>
            <p className="font-medium text-sm text-slate-900">Research Lab</p>
            {hasEnoughFeedback ? (
              <p className={`text-xs mt-0.5 ${isActive ? 'text-blue-600' : 'text-muted-foreground'}`}>
                {isActive
                  ? 'Your startup is live in the Research Lab. Community members can give structured feedback.'
                  : 'Enable to receive structured feedback from community members.'}
              </p>
            ) : (
              <p className="text-xs mt-0.5 text-amber-600">
                You need to give feedback on {remaining} more startup{remaining !== 1 ? 's' : ''} before you can receive research feedback.
              </p>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          {hasEnoughFeedback ? (
            <button
              onClick={toggle}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                isActive ? 'bg-blue-500' : 'bg-slate-300'
              } ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          ) : (
            <LinkButton href="/research-lab" size="sm" variant="outline" className="text-xs border-amber-300 text-amber-700 hover:bg-amber-50">
              Give Feedback →
            </LinkButton>
          )}
        </div>
      </div>

      {!hasEnoughFeedback && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex gap-1">
              {Array.from({ length: REQUIRED_FEEDBACKS }).map((_, i) => (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i < feedbackGivenCount
                      ? 'bg-green-100 text-green-600'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {i < feedbackGivenCount ? '✓' : i + 1}
                </div>
              ))}
            </div>
            <span>{feedbackGivenCount}/{REQUIRED_FEEDBACKS} feedbacks given</span>
          </div>
        </div>
      )}
    </div>
  )
}
