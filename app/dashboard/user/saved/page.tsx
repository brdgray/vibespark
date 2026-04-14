import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Bookmark, CheckCircle2 } from 'lucide-react'
import { LinkButton } from '@/components/ui/link-button'
import StageBadge from '@/components/startup/StageBadge'
import Link from 'next/link'
import Image from 'next/image'

export const metadata = { title: 'Saved Startups' }

export default async function SavedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: saves } = await supabase
    .from('startup_saves')
    .select(`
      created_at,
      startups(id, name, slug, tagline, logo_path, verification_status,
        startup_stages(name), startup_categories(name))
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Saved Startups</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{saves?.length ?? 0} startups in your watchlist</p>
        </div>
        <LinkButton href="/directory" size="sm" variant="outline">
          Browse More
        </LinkButton>
      </div>

      {!saves || saves.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center text-muted-foreground">
          <Bookmark className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No saved startups yet</p>
          <p className="text-sm mt-1">Save startups from their profile pages to track them here.</p>
          <LinkButton href="/directory" className="mt-4 inline-block" size="sm" variant="outline">
            Explore Directory
          </LinkButton>
        </div>
      ) : (
        <div className="space-y-3">
          {saves.map((s: any) => {
            const startup = s.startups
            if (!startup) return null
            return (
              <Link key={startup.slug} href={`/startups/${startup.slug}`}>
                <div className="bg-white rounded-2xl border p-4 hover:shadow-sm transition-shadow flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {startup.logo_path ? (
                      <Image src={startup.logo_path} alt={startup.name} width={48} height={48} className="object-contain" />
                    ) : (
                      <span className="text-lg font-bold text-slate-400">{startup.name[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{startup.name}</span>
                      {startup.verification_status === 'verified' && (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{startup.tagline}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {startup.startup_stages?.name && <StageBadge stage={startup.startup_stages.name} />}
                    <span className="text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString()}
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
