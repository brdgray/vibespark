'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

interface VerificationQueueProps {
  startups: any[]
}

export default function VerificationQueue({ startups: initial }: VerificationQueueProps) {
  const [startups, setStartups] = useState(initial)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function updateStatus(id: string, status: 'verified' | 'rejected') {
    setLoading(id)
    const { error } = await (supabase.from('startups') as any)
      .update({ verification_status: status })
      .eq('id', id)

    if (error) {
      toast.error('Failed to update status')
    } else {
      setStartups(prev => prev.filter(s => s.id !== id))
      toast.success(`Startup ${status === 'verified' ? 'verified' : 'rejected'}`)
      router.refresh()
    }
    setLoading(null)
  }

  if (startups.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-300" />
        <p className="font-medium">All caught up!</p>
        <p className="text-sm">No startups pending verification.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {startups.map(startup => (
        <div key={startup.id} className="bg-white rounded-2xl border p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-semibold text-slate-900">{startup.name}</span>
                {startup.startup_stages?.name && (
                  <Badge variant="secondary" className="text-xs">{startup.startup_stages.name}</Badge>
                )}
                {startup.startup_categories?.name && (
                  <Badge variant="outline" className="text-xs">{startup.startup_categories.name}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{startup.tagline}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>By: {startup.profiles?.display_name ?? startup.profiles?.email}</span>
                <a href={startup.website_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-orange-500 hover:underline">
                  {startup.website_url} <ExternalLink className="h-3 w-3" />
                </a>
                <span>{new Date(startup.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setExpanded(expanded === startup.id ? null : startup.id)}
                className="text-xs text-muted-foreground hover:text-slate-700 flex items-center gap-1"
              >
                {expanded === startup.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Details
              </button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => updateStatus(startup.id, 'rejected')}
                disabled={loading === startup.id}
              >
                <XCircle className="mr-1 h-4 w-4" /> Reject
              </Button>
              <Button
                size="sm"
                className="bg-green-500 hover:bg-green-600"
                onClick={() => updateStatus(startup.id, 'verified')}
                disabled={loading === startup.id}
              >
                <CheckCircle2 className="mr-1 h-4 w-4" /> Verify
              </Button>
            </div>
          </div>

          {expanded === startup.id && (
            <div className="mt-4 pt-4 border-t text-sm space-y-2 text-slate-700">
              <div><strong>Description:</strong> {startup.description}</div>
              {startup.target_audience && <div><strong>Target Audience:</strong> {startup.target_audience}</div>}
              {startup.ai_stack && startup.ai_stack.length > 0 && (
                <div><strong>AI Stack:</strong> {startup.ai_stack.join(', ')}</div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
