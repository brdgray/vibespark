import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

interface Props {
  params: { id: string }
}

export const metadata = { title: 'Admin — User Activity' }

export default async function AdminUserDetailPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: meRoles } = await supabase.from('user_roles').select('role').eq('user_id', user.id)
  const isAdmin = (meRoles ?? []).some((r: any) => r.role === 'admin')
  if (!isAdmin) redirect('/dashboard')

  const [
    { data: profile },
    { data: roles },
    { data: startups },
    { data: recentVotes },
    { data: recentSaves },
    { data: recentComments },
    { data: recentResearch },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', params.id).maybeSingle(),
    supabase.from('user_roles').select('role').eq('user_id', params.id),
    supabase.from('startups').select('id, name, slug, created_at, verification_status').eq('created_by', params.id).order('created_at', { ascending: false }),
    supabase.from('startup_votes').select('id, startup_id, created_at, startups(name, slug)').eq('user_id', params.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('startup_saves').select('id, startup_id, created_at, startups(name, slug)').eq('user_id', params.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('startup_comments').select('id, startup_id, body, created_at, status, startups(name, slug)').eq('user_id', params.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('research_responses').select('id, startup_id, would_use, created_at, startups(name, slug)').eq('user_id', params.id).order('created_at', { ascending: false }).limit(20),
  ])

  if (!profile) notFound()

  const timeline = [
    ...(recentVotes ?? []).map((item: any) => ({
      key: `vote-${item.id}`,
      created_at: item.created_at,
      label: 'Supported startup',
      startup: item.startups,
      detail: null,
    })),
    ...(recentSaves ?? []).map((item: any) => ({
      key: `save-${item.id}`,
      created_at: item.created_at,
      label: 'Saved startup',
      startup: item.startups,
      detail: null,
    })),
    ...(recentComments ?? []).map((item: any) => ({
      key: `comment-${item.id}`,
      created_at: item.created_at,
      label: `Commented (${item.status})`,
      startup: item.startups,
      detail: item.body ? String(item.body).slice(0, 120) : null,
    })),
    ...(recentResearch ?? []).map((item: any) => ({
      key: `research-${item.id}`,
      created_at: item.created_at,
      label: `Research feedback: ${item.would_use}`,
      startup: item.startups,
      detail: null,
    })),
  ].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Activity</h1>
          <p className="mt-1 text-sm text-muted-foreground">Detailed actions for moderation and support.</p>
        </div>
        <Link href="/dashboard/admin/users" className="text-sm text-orange-600 hover:underline">Back to users</Link>
      </div>

      <section className="rounded-2xl border bg-white p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900">{(profile as any).display_name || 'No name'}</h2>
          {(roles ?? []).map((r: any) => (
            <Badge key={r.role} variant="secondary">{r.role}</Badge>
          ))}
          {(profile as any).is_suspended && <Badge className="bg-red-100 text-red-700 border-red-200">Suspended</Badge>}
        </div>
        <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <div>User ID: <span className="font-mono text-slate-700">{(profile as any).id}</span></div>
          <div>Email: <span className="text-slate-700">{(profile as any).email ?? 'Unknown'}</span></div>
          <div>Joined: <span className="text-slate-700">{new Date((profile as any).created_at).toLocaleString()}</span></div>
          <div>Research panel: <span className="text-slate-700">{(profile as any).is_research_participant ? 'Yes' : 'No'}</span></div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Startups Owned</h3>
        <div className="mt-3 space-y-2">
          {(startups ?? []).length === 0 && <p className="text-sm text-muted-foreground">No startups created.</p>}
          {(startups ?? []).map((s: any) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="font-medium text-slate-900">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.verification_status} • {new Date(s.created_at).toLocaleDateString()}</p>
              </div>
              <Link href={`/startups/${s.slug}`} className="text-sm text-orange-600 hover:underline">Open profile</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent Site Interactions</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Note: sign-in session logs are not stored in the app database today; this view shows in-app actions.
        </p>
        <div className="mt-3 space-y-2">
          {timeline.length === 0 && <p className="text-sm text-muted-foreground">No activity recorded yet.</p>}
          {timeline.map((item) => (
            <div key={item.key} className="rounded-xl border p-3">
              <p className="text-sm font-medium text-slate-900">{item.label}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(item.created_at).toLocaleString()}
                {item.startup?.slug ? (
                  <>
                    {' '}•{' '}
                    <Link href={`/startups/${item.startup.slug}`} className="text-orange-600 hover:underline">
                      {item.startup.name}
                    </Link>
                  </>
                ) : null}
              </p>
              {item.detail && <p className="mt-1 text-xs text-slate-600">{item.detail}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
