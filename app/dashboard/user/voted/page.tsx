import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowUp } from 'lucide-react'
import { LinkButton } from '@/components/ui/link-button'
import StageBadge from '@/components/startup/StageBadge'
import Link from 'next/link'

export const metadata = { title: 'Voted Startups' }

export default async function VotedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: votes } = await supabase
    .from('startup_votes')
    .select(`
      created_at,
      startups(id, name, slug, tagline, verification_status, startup_stages(name))
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Voted Startups</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {votes?.length ?? 0} startups supported
          </p>
        </div>
        <LinkButton href="/directory" size="sm" variant="outline">Browse More</LinkButton>
      </div>

      {!votes || votes.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center text-muted-foreground">
          <ArrowUp className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No votes yet</p>
          <p className="text-sm mt-1">Support startups you believe in by clicking &ldquo;Support this Startup&rdquo; on their profile.</p>
          <LinkButton href="/directory" className="mt-4 inline-block" size="sm" variant="outline">
            Explore Directory
          </LinkButton>
        </div>
      ) : (
        <div className="space-y-3">
          {votes.map((v: any) => {
            const startup = v.startups
            if (!startup) return null
            return (
              <Link key={startup.slug + v.created_at} href={`/startups/${startup.slug}`}>
                <div className="bg-white rounded-2xl border p-4 hover:shadow-sm transition-shadow flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <ArrowUp className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900">{startup.name}</div>
                    <p className="text-sm text-muted-foreground truncate">{startup.tagline}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {startup.startup_stages?.name && <StageBadge stage={startup.startup_stages.name} />}
                    <span className="text-xs text-muted-foreground">
                      {new Date(v.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
