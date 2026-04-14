'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Flag, MessageSquare, FlaskConical, UserX, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface ModerationTabsProps {
  reports: any[]
  flaggedComments: any[]
  feedbackResponses: any[]
}

export default function ModerationTabs({ reports, flaggedComments, feedbackResponses }: ModerationTabsProps) {
  const [responses, setResponses] = useState(feedbackResponses)
  const [suspending, setSuspending] = useState<string | null>(null)

  async function suspendUser(userId: string) {
    setSuspending(userId)
    const res = await fetch('/api/admin/suspend-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, suspend: true }),
    })
    if (res.ok) {
      toast.success('User suspended')
      setResponses(prev => prev.map(r =>
        r.profiles?.id === userId
          ? { ...r, profiles: { ...r.profiles, is_suspended: true } }
          : r
      ))
    } else {
      toast.error('Failed to suspend user')
    }
    setSuspending(null)
  }

  async function flagResponse(responseId: string) {
    const res = await fetch('/api/admin/flag-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responseId }),
    })
    if (res.ok) {
      toast.success('Response flagged')
      setResponses(prev => prev.map(r =>
        r.id === responseId ? { ...r, is_flagged: true } : r
      ))
    }
  }

  return (
    <Tabs defaultValue="reports">
      <TabsList className="mb-6">
        <TabsTrigger value="reports" className="flex items-center gap-1.5">
          <Flag className="h-4 w-4" /> Reports
          {reports.length > 0 && (
            <Badge className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0">{reports.length}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="comments" className="flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4" /> Flagged Comments
          {flaggedComments.length > 0 && (
            <Badge className="ml-1 bg-purple-500 text-white text-xs px-1.5 py-0">{flaggedComments.length}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="feedback" className="flex items-center gap-1.5">
          <FlaskConical className="h-4 w-4" /> Feedback Quality
        </TabsTrigger>
      </TabsList>

      {/* Reports */}
      <TabsContent value="reports">
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl border">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No open reports</p>
            </div>
          ) : (
            reports.map((r: any) => (
              <div key={r.id} className="bg-white rounded-2xl border p-4 flex items-start gap-4">
                <Flag className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm">{r.entity_type}</span>
                    <Badge variant="secondary" className="text-xs">{r.reason}</Badge>
                    <span className="text-xs text-muted-foreground">
                      by {r.profiles?.display_name ?? 'Unknown'} · {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{r.details}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </TabsContent>

      {/* Flagged Comments */}
      <TabsContent value="comments">
        <div className="space-y-3">
          {flaggedComments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl border">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No flagged comments</p>
            </div>
          ) : (
            flaggedComments.map((c: any) => (
              <div key={c.id} className="bg-white rounded-2xl border border-red-100 p-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-medium text-sm">{c.profiles?.display_name}</span>
                  <span className="text-xs text-muted-foreground">on</span>
                  <Link href={`/startups/${c.startups?.slug}`} className="text-xs text-orange-500 hover:underline">
                    {c.startups?.name}
                  </Link>
                </div>
                <p className="text-sm text-slate-700">{c.body}</p>
              </div>
            ))
          )}
        </div>
      </TabsContent>

      {/* Feedback Quality */}
      <TabsContent value="feedback">
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="px-5 py-3 border-b bg-slate-50 text-xs font-medium text-muted-foreground">
            Review research feedback quality. Flag low-effort responses and suspend users who consistently submit them.
          </div>
          <div className="divide-y">
            {responses.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">No feedback responses yet</div>
            )}
            {responses.map((r: any) => (
              <div key={r.id} className={`p-5 ${r.is_flagged ? 'bg-red-50/30' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-medium text-sm text-slate-900">
                        {r.profiles?.display_name ?? 'Unknown user'}
                      </span>
                      {r.profiles?.is_suspended && (
                        <Badge className="bg-red-100 text-red-700 text-xs">Suspended</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">→</span>
                      <Link href={`/startups/${r.startups?.slug}`} className="text-xs text-orange-500 hover:underline">
                        {r.startups?.name}
                      </Link>
                      <Badge variant="secondary" className="text-xs">
                        {r.would_use === 'yes' ? '👍 Would Use' : r.would_use === 'maybe' ? '🤔 Maybe' : '👎 No'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Clarity: {r.clarity_score}/5 · {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {r.problem_understanding && (
                      <p className="text-xs text-slate-600 mb-1"><span className="font-medium">Understanding:</span> {r.problem_understanding}</p>
                    )}
                    {r.missing_features && (
                      <p className="text-xs text-slate-600 mb-1"><span className="font-medium">Missing:</span> {r.missing_features}</p>
                    )}
                    {r.friction_points && (
                      <p className="text-xs text-slate-600"><span className="font-medium">Friction:</span> {r.friction_points}</p>
                    )}
                    {!r.problem_understanding && !r.missing_features && !r.friction_points && (
                      <p className="text-xs text-muted-foreground italic">No written feedback provided</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {!r.is_flagged && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-amber-600 border-amber-300 hover:bg-amber-50"
                        onClick={() => flagResponse(r.id)}
                      >
                        <Flag className="h-3 w-3 mr-1" /> Flag
                      </Button>
                    )}
                    {r.is_flagged && (
                      <Badge className="bg-amber-100 text-amber-700 text-xs">Flagged</Badge>
                    )}
                    {r.profiles?.id && !r.profiles?.is_suspended && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                        disabled={suspending === r.profiles.id}
                        onClick={() => suspendUser(r.profiles.id)}
                      >
                        <UserX className="h-3 w-3 mr-1" />
                        {suspending === r.profiles.id ? '…' : 'Suspend'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
