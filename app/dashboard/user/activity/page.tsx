import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'All Activity' }

const eventLabels: Record<string, { label: string; icon: string; color: string }> = {
  signup_bonus:       { label: 'Joined VibeSpark',        icon: '🎉', color: 'text-green-600' },
  research_feedback:  { label: 'Gave research feedback',  icon: '🔬', color: 'text-blue-600' },
  vote:               { label: 'Supported a startup',     icon: '🚀', color: 'text-orange-600' },
  save:               { label: 'Saved a startup',         icon: '⭐', color: 'text-amber-600' },
  comment:            { label: 'Left a comment',          icon: '💬', color: 'text-slate-600' },
  vote_removed:       { label: 'Removed a vote',          icon: '↩️',  color: 'text-slate-400' },
  save_removed:       { label: 'Removed a save',          icon: '↩️',  color: 'text-slate-400' },
}

export default async function AllActivityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: activity } = await (supabase as any)
    .from('user_score_events')
    .select('event_type, points, startup_id, created_at, startups(name, slug)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/user" className="text-muted-foreground hover:text-slate-700 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Activity</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{activity?.length ?? 0} events</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border divide-y">
        {!activity || activity.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">No activity yet.</div>
        ) : (
          activity.map((event: any, i: number) => {
            const cfg = eventLabels[event.event_type] ?? { label: event.event_type, icon: '•', color: 'text-slate-500' }
            return (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{cfg.icon}</span>
                  <div>
                    <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
                    {event.startups?.name && (
                      <Link href={`/startups/${event.startups.slug}`} className="ml-2 text-xs text-muted-foreground hover:text-orange-500">
                        {event.startups.name}
                      </Link>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs font-semibold ${event.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {event.points > 0 ? '+' : ''}{event.points} pts
                  </span>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(event.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
