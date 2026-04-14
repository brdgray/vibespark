import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Bookmark, ArrowUp, FlaskConical, Zap, TrendingUp } from 'lucide-react'
import { LinkButton } from '@/components/ui/link-button'
import BadgeDisplay from '@/components/user/BadgeDisplay'
import Link from 'next/link'

export const metadata = { title: 'My Dashboard' }

export default async function UserOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const [
    { count: saveCount },
    { count: voteCount },
    { count: researchCount },
    { data: scoreData },
    { data: badgesData },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from('startup_saves').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('startup_votes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('research_responses').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    (supabase as any).from('user_scores').select('total_score').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_badges' as any).select('badge_key').eq('user_id', user.id),
    (supabase as any).from('user_score_events')
      .select('event_type, points, startup_id, created_at, startups(name, slug)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const totalScore = (scoreData as any)?.total_score ?? 0
  const badgeKeys = (badgesData as any[])?.map((b: any) => b.badge_key) ?? []

  const eventLabels: Record<string, { label: string; icon: string; color: string }> = {
    signup_bonus:       { label: 'Joined VibeSpark',     icon: '🎉', color: 'text-green-600' },
    research_feedback:  { label: 'Gave research feedback', icon: '🔬', color: 'text-blue-600' },
    vote:               { label: 'Supported a startup',  icon: '🚀', color: 'text-orange-600' },
    save:               { label: 'Saved a startup',      icon: '⭐', color: 'text-amber-600' },
    comment:            { label: 'Left a comment',       icon: '💬', color: 'text-slate-600' },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your VibeSpark activity at a glance</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Score', value: totalScore.toLocaleString(), icon: Zap, color: 'text-orange-500', href: null },
          { label: 'Voted', value: voteCount ?? 0, icon: ArrowUp, color: 'text-orange-400', href: '/dashboard/user/voted' },
          { label: 'Saved', value: saveCount ?? 0, icon: Bookmark, color: 'text-blue-500', href: '/dashboard/user/saved' },
          { label: 'Research Given', value: researchCount ?? 0, icon: FlaskConical, color: 'text-green-500', href: '/dashboard/user/research' },
        ].map(stat => {
          const Icon = stat.icon
          const inner = (
            <div className="bg-white rounded-2xl border p-4 hover:shadow-sm transition-shadow">
              <div className={`text-2xl font-bold ${stat.color} flex items-center gap-1.5`}>
                <Icon className="h-5 w-5" />
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          )
          return stat.href ? (
            <Link key={stat.label} href={stat.href}>{inner}</Link>
          ) : (
            <div key={stat.label}>{inner}</div>
          )
        })}
      </div>

      {/* Score breakdown */}
      <div className="bg-white rounded-2xl border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            Your Impact Score
          </h2>
          <span className="text-xl font-bold text-orange-500">{totalScore.toLocaleString()} pts</span>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          {[
            { emoji: '🔬', label: 'Research feedback', count: researchCount ?? 0, pts: (researchCount ?? 0) * 20, mult: 20, color: 'text-blue-600' },
            { emoji: '🚀', label: 'Startups supported', count: voteCount ?? 0, pts: (voteCount ?? 0) * 5, mult: 5, color: 'text-orange-600' },
            { emoji: '⭐', label: 'Startups saved', count: saveCount ?? 0, pts: (saveCount ?? 0) * 2, mult: 2, color: 'text-amber-600' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between gap-2">
              <span className="truncate">{row.emoji} {row.label}</span>
              <span className="font-medium text-slate-700 shrink-0 text-xs sm:text-sm">
                {row.count} × {row.mult} = <span className={row.color}>{row.pts} pts</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      {badgeKeys.length > 0 && (
        <div className="bg-white rounded-2xl border p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Your Badges</h2>
          <BadgeDisplay earnedKeys={badgeKeys} />
        </div>
      )}

      {/* Recent activity */}
      <div className="bg-white rounded-2xl border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Recent Activity</h2>
          {recentActivity && recentActivity.length >= 10 && (
            <Link href="/dashboard/user/activity" className="text-xs text-orange-500 hover:text-orange-600 font-medium">
              View All →
            </Link>
          )}
        </div>
        {!recentActivity || recentActivity.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No activity yet. Start by exploring startups!</p>
            <LinkButton href="/directory" size="sm" variant="outline" className="mt-3">
              Browse Directory
            </LinkButton>
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((event: any, i: number) => {
              const cfg = eventLabels[event.event_type] ?? { label: event.event_type, icon: '•', color: 'text-slate-500' }
              return (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
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
                  <div className="text-right">
                    <span className={`text-xs font-semibold ${event.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {event.points > 0 ? '+' : ''}{event.points} pts
                    </span>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(event.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
