import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FlaskConical } from 'lucide-react'
import { LinkButton } from '@/components/ui/link-button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export const metadata = { title: 'Research Given' }

export default async function ResearchPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: responses } = await supabase
    .from('research_responses')
    .select(`
      created_at, would_use, clarity_score, missing_features, friction_points,
      startups(name, slug, tagline)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const wouldUseConfig = {
    yes:   { label: '👍 Would Use',     color: 'bg-green-100 text-green-700 border-green-200' },
    maybe: { label: '🤔 Maybe',         color: 'bg-amber-100 text-amber-700 border-amber-200' },
    no:    { label: '👎 Not For Me',    color: 'bg-slate-100 text-slate-700 border-slate-200' },
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Research Given</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {responses?.length ?? 0} feedback responses submitted
            {(responses?.length ?? 0) < 3 && (
              <span className="ml-2 text-amber-600 font-medium">
                — give feedback on {3 - (responses?.length ?? 0)} more startups to unlock your own research
              </span>
            )}
          </p>
        </div>
        <LinkButton href="/research-lab" size="sm" variant="outline">
          <FlaskConical className="mr-1.5 h-4 w-4" /> Research Lab
        </LinkButton>
      </div>

      {/* Progress toward unlock */}
      {(responses?.length ?? 0) < 3 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-2">Unlock your startup feedback</p>
          <p className="text-xs text-amber-600 mb-3">Give feedback on 3 startups to unlock research responses for your own startup.</p>
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                i < (responses?.length ?? 0)
                  ? 'bg-green-100 text-green-600'
                  : 'bg-amber-100 text-amber-400'
              }`}>
                {i < (responses?.length ?? 0) ? '✓' : i + 1}
              </div>
            ))}
          </div>
        </div>
      )}

      {!responses || responses.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center text-muted-foreground">
          <FlaskConical className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No research submitted yet</p>
          <p className="text-sm mt-1">Visit the Research Lab to give structured feedback to founders.</p>
          <LinkButton href="/research-lab" className="mt-4 inline-block" size="sm" variant="outline">
            Visit Research Lab
          </LinkButton>
        </div>
      ) : (
        <div className="space-y-3">
          {responses.map((r: any, i: number) => {
            const cfg = wouldUseConfig[r.would_use as keyof typeof wouldUseConfig] ?? wouldUseConfig.no
            return (
              <div key={i} className="bg-white rounded-2xl border p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <Link href={`/startups/${r.startups?.slug}`} className="font-semibold text-slate-900 hover:text-orange-500">
                      {r.startups?.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{r.startups?.tagline}</p>
                  </div>
                  <Badge className={`text-xs shrink-0 ${cfg.color}`}>{cfg.label}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Clarity: {'⭐'.repeat(r.clarity_score)}{'☆'.repeat(5 - r.clarity_score)}</span>
                  <span>{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                {(r.missing_features || r.friction_points) && (
                  <div className="mt-2 pt-2 border-t text-xs text-slate-600 space-y-1">
                    {r.missing_features && <p><span className="font-medium">Missing:</span> {r.missing_features}</p>}
                    {r.friction_points && <p><span className="font-medium">Friction:</span> {r.friction_points}</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
