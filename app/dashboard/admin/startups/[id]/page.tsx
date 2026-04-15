import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchMetricsMap } from '@/lib/utils/metrics'
import EditStartupForm from '@/app/dashboard/startup/[id]/edit/EditStartupForm'
import SparkScore from '@/components/startup/SparkScore'

interface Props {
  params: { id: string }
}

export const metadata = { title: 'Admin — Startup Detail' }

export default async function AdminStartupDetailPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: meRoles } = await supabase.from('user_roles').select('role').eq('user_id', user.id)
  const isAdmin = (meRoles ?? []).some((r: any) => r.role === 'admin')
  if (!isAdmin) redirect('/dashboard')

  const { data: startup } = await supabase
    .from('startups')
    .select(`
      *,
      profiles(display_name, email),
      startup_categories(name),
      startup_stages(name),
      startup_social_links(*),
      startup_team_members(*),
      research_requests(id, is_active)
    `)
    .eq('id', params.id)
    .maybeSingle()

  const typedStartup = startup as any
  if (!typedStartup) notFound()

  const [{ data: screenshots }, { data: categories }, { data: stages }] = await Promise.all([
    supabase.from('startup_screenshots').select('id, storage_path, display_order').eq('startup_id', typedStartup.id).order('display_order', { ascending: true }),
    supabase.from('startup_categories').select('id, name').order('name', { ascending: true }),
    supabase.from('startup_stages').select('id, name, sort_order').order('sort_order', { ascending: true }),
  ])

  const metricsMap = await fetchMetricsMap(supabase, [typedStartup.id])
  const metrics = metricsMap[typedStartup.id] ?? {}
  const hasActiveResearchRequest = !!typedStartup.research_requests?.some((r: any) => r.is_active)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Startup</h1>
          <p className="mt-1 text-sm text-muted-foreground">Admin controls, analytics, and full profile editing.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/startups/${typedStartup.slug}`} target="_blank" className="text-sm text-orange-600 hover:underline">Open public profile</Link>
          <Link href="/dashboard/admin/startups" className="text-sm text-slate-600 hover:underline">Back to startups</Link>
        </div>
      </div>

      <section className="grid gap-3 rounded-2xl border bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-slate-50 p-3">
          <p className="text-xs text-muted-foreground">Spark Score</p>
          <div className="mt-1"><SparkScore score={Math.round(metrics.spark_score ?? 0)} size="sm" /></div>
        </div>
        <div className="rounded-xl border bg-slate-50 p-3">
          <p className="text-xs text-muted-foreground">Would Use</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{Math.round(metrics.would_use_pct ?? 0)}%</p>
        </div>
        <div className="rounded-xl border bg-slate-50 p-3">
          <p className="text-xs text-muted-foreground">Research Lab</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{hasActiveResearchRequest ? 'Opted in (active request)' : 'Opted out / inactive request'}</p>
        </div>
        <div className="rounded-xl border bg-slate-50 p-3">
          <p className="text-xs text-muted-foreground">Supporters</p>
          <p className="mt-1 text-2xl font-bold text-orange-600">{metrics.support_count ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-slate-50 p-3">
          <p className="text-xs text-muted-foreground">Saves</p>
          <p className="mt-1 text-2xl font-bold text-slate-700">{metrics.save_count ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-slate-50 p-3">
          <p className="text-xs text-muted-foreground">Comments</p>
          <p className="mt-1 text-2xl font-bold text-slate-700">{metrics.total_comments ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-slate-50 p-3">
          <p className="text-xs text-muted-foreground">Research Responses</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{metrics.total_research_responses ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-slate-50 p-3">
          <p className="text-xs text-muted-foreground">Owner</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{typedStartup.profiles?.display_name ?? typedStartup.profiles?.email ?? 'Unknown'}</p>
        </div>
      </section>

      <EditStartupForm
        startup={typedStartup}
        categories={(categories ?? []) as any[]}
        stages={(stages ?? []) as any[]}
        screenshots={(screenshots ?? []) as any[]}
        adminMode
      />
    </div>
  )
}
