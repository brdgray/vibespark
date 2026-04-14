import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReportedContent from '../ReportedContent'
import ModerationTabs from './ModerationTabs'

export const metadata = { title: 'Admin — Moderation' }

export default async function AdminModerationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const [
    { data: reports },
    { data: flaggedComments },
    { data: feedbackResponses },
  ] = await Promise.all([
    supabase.from('reports')
      .select('*, profiles(display_name)')
      .eq('status', 'open')
      .order('created_at'),

    supabase.from('startup_comments')
      .select('*, profiles(display_name), startups(name, slug)')
      .eq('status', 'flagged')
      .order('created_at'),

    supabase.from('research_responses')
      .select(`
        *,
        profiles(id, display_name, is_suspended),
        startups(name, slug)
      `)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Moderation</h1>
        <p className="text-muted-foreground mt-0.5">Review reports, flagged content, and research feedback quality</p>
      </div>
      <ModerationTabs
        reports={reports ?? []}
        flaggedComments={flaggedComments ?? []}
        feedbackResponses={feedbackResponses ?? []}
      />
    </div>
  )
}
