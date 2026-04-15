import { createClient } from '@/lib/supabase/server'
import { fetchMetricsMap } from '@/lib/utils/metrics'
import { redirect } from 'next/navigation'
import { LinkButton } from '@/components/ui/link-button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, Clock, XCircle, AlertCircle, Plus, TrendingUp, FlaskConical, Zap } from 'lucide-react'
import StartupMetricsChart from './StartupMetricsChart'
import StageBadge from '@/components/startup/StageBadge'
import SparkScore from '@/components/startup/SparkScore'
import ResearchLabToggle from './ResearchLabToggle'
import {
  fetchFeedbackToOthersCount,
  founderResearchGivebackMet,
  RESEARCH_GIVEBACK_REQUIRED,
} from '@/lib/utils/research-giveback'

export const metadata = { title: 'Startup Dashboard' }

const statusConfig = {
  pending:   { icon: Clock,        label: 'Pending Verification', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  verified:  { icon: CheckCircle2, label: 'Verified',             color: 'bg-green-100 text-green-700 border-green-200' },
  rejected:  { icon: XCircle,      label: 'Rejected',             color: 'bg-red-100 text-red-700 border-red-200' },
  suspended: { icon: AlertCircle,  label: 'Suspended',            color: 'bg-slate-100 text-slate-700 border-slate-200' },
}

export default async function StartupDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: rawStartups } = await supabase
    .from('startups')
    .select('*, startup_categories(name), startup_stages(name), research_requests(id, is_active, created_at)')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  const ids = (rawStartups ?? []).map((s: any) => s.id)
  const metricsMap = await fetchMetricsMap(supabase, ids)
  const startups = (rawStartups ?? []).map((s: any) => ({
    ...s,
    startup_spark_score_metrics: [metricsMap[s.id] ?? {}],
  }))

  const feedbackToOthersCount = await fetchFeedbackToOthersCount(supabase, user.id)
  const givebackMet = founderResearchGivebackMet(feedbackToOthersCount)

  if (!startups || startups.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-2xl">
        <div className="text-6xl mb-4">🚀</div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">No Startups Yet</h1>
        <p className="text-muted-foreground mb-8">
          Submit your first startup to get verified and start collecting community traction.
        </p>
        <LinkButton href="/submit" className="bg-orange-500 hover:bg-orange-600" size="lg">
          <Plus className="mr-2 h-4 w-4" /> Submit Your Startup
        </LinkButton>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl space-y-10">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Startup Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track traction and community signals</p>
        </div>
        <LinkButton href="/submit" className="bg-orange-500 hover:bg-orange-600">
          <Plus className="mr-1.5 h-4 w-4" /> Add Startup
        </LinkButton>
      </div>

      {/* One card per startup */}
      {startups.map((startup: any) => {
        const rawMetrics = startup.startup_spark_score_metrics?.[0] ?? {}
        const metrics = givebackMet
          ? rawMetrics
          : {
              ...rawMetrics,
              total_research_responses: 0,
              would_use_yes: 0,
              would_use_maybe: 0,
              would_use_no: 0,
              would_use_pct: 0,
            }
        const status = statusConfig[startup.verification_status as keyof typeof statusConfig] ?? statusConfig.pending
        const StatusIcon = status.icon
        const activeRequest = startup.research_requests?.find((r: any) => r.is_active) ?? null
        const anyRequest = startup.research_requests?.[0] ?? null

        return (
          <div key={startup.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">

            {/* ── Header ── */}
            <div className="px-6 py-5 border-b">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-900">{startup.name}</h2>
                    <Badge className={`text-xs border ${status.color}`}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {status.label}
                    </Badge>
                    {startup.is_promoted && (
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">Promoted</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm mt-1 truncate">{startup.tagline}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {startup.startup_stages?.name && <StageBadge stage={startup.startup_stages.name} />}
                    {startup.startup_categories?.name && (
                      <Badge variant="secondary" className="text-xs">{startup.startup_categories.name}</Badge>
                    )}
                  </div>
                </div>
                <LinkButton href={`/startups/${startup.slug}`} variant="outline" size="sm" className="shrink-0">
                  View Profile
                </LinkButton>
              </div>
            </div>

            {/* Tabs sit directly under the header; all body content lives inside panels */}
            <Tabs defaultValue="analytics" className="flex flex-col gap-0">
              <div className="border-b border-slate-200 bg-slate-50/50 px-6">
                <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-0 bg-transparent p-0 shadow-none">
                  <TabsTrigger
                    value="analytics"
                    className="rounded-none border-b-2 border-transparent px-0 py-3.5 text-sm font-medium text-muted-foreground data-active:border-orange-500 data-active:bg-transparent data-active:text-orange-600 data-active:shadow-none"
                  >
                    <TrendingUp className="mr-1.5 h-4 w-4" /> Analytics
                  </TabsTrigger>
                  <TabsTrigger
                    value="research"
                    className="ml-8 rounded-none border-b-2 border-transparent px-0 py-3.5 text-sm font-medium text-muted-foreground data-active:border-blue-500 data-active:bg-transparent data-active:text-blue-600 data-active:shadow-none"
                  >
                    <FlaskConical className="mr-1.5 h-4 w-4" /> Research Lab
                    {activeRequest && (
                      <span className="ml-1.5 inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                        Live
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="analytics" className="m-0 outline-none">
                <div className="space-y-6 p-6">
                  {!givebackMet && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      <p className="font-semibold">Unlock incoming Research Lab feedback</p>
                      <p className="mt-1 text-xs text-amber-800">
                        Give structured feedback on {RESEARCH_GIVEBACK_REQUIRED - feedbackToOthersCount} more startup
                        {RESEARCH_GIVEBACK_REQUIRED - feedbackToOthersCount === 1 ? '' : 's'} you don&apos;t own to read feedback others left on your listings. Research counts and breakdown below stay hidden until then.
                      </p>
                      <LinkButton href="/research-lab" size="sm" variant="outline" className="mt-3 border-amber-300 text-amber-900">
                        Go to Research Lab
                      </LinkButton>
                    </div>
                  )}
                  <section aria-labelledby={`metrics-${startup.id}`}>
                    <h3 id={`metrics-${startup.id}`} className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Key metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { label: 'Spark Score',       value: <SparkScore score={Math.round(metrics.spark_score ?? 0)} size="sm" /> },
                        {
                          label: 'Would Use',
                          value: givebackMet ? (
                            <span className="text-2xl font-bold text-green-600">{Math.round(rawMetrics.would_use_pct ?? 0)}%</span>
                          ) : (
                            <span className="text-2xl font-bold text-amber-600">—</span>
                          ),
                        },
                        { label: 'Supporters',         value: <span className="text-2xl font-bold text-orange-500">{metrics.support_count ?? 0}</span> },
                        {
                          label: 'Research Responses',
                          value: givebackMet ? (
                            <span className="text-2xl font-bold text-blue-500">{rawMetrics.total_research_responses ?? 0}</span>
                          ) : (
                            <span className="text-2xl font-bold text-amber-600">—</span>
                          ),
                        },
                        { label: 'Saves',              value: <span className="text-2xl font-bold text-slate-700">{metrics.save_count ?? 0}</span> },
                        { label: 'Comments',           value: <span className="text-2xl font-bold text-slate-700">{metrics.total_comments ?? 0}</span> },
                        { label: 'Avg Rating',         value: <span className="text-2xl font-bold text-slate-700">{metrics.avg_rating ? Number(metrics.avg_rating).toFixed(1) : '—'}</span> },
                        { label: '7d Activity',        value: <span className="text-2xl font-bold text-purple-500">{metrics.activity_7d ?? 0}</span> },
                      ].map(stat => (
                        <div key={stat.label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div className="mb-0.5">{stat.value}</div>
                          <div className="text-xs text-muted-foreground">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section aria-labelledby={`chart-${startup.id}`}>
                    <h3 id={`chart-${startup.id}`} className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Would use breakdown
                    </h3>
                    {!givebackMet ? (
                      <div className="rounded-xl border border-amber-100 bg-amber-50/80 py-10 text-center text-amber-900">
                        <Zap className="mx-auto mb-2 h-8 w-8 opacity-40" />
                        <p className="text-sm font-medium">Would-use breakdown is locked</p>
                        <p className="mt-1 px-4 text-xs text-amber-800">
                          Complete {RESEARCH_GIVEBACK_REQUIRED} feedback sessions on other startups to see how testers rated yours.
                        </p>
                      </div>
                    ) : (rawMetrics.would_use_yes || rawMetrics.would_use_maybe || rawMetrics.would_use_no) ? (
                      <StartupMetricsChart
                        wouldUseYes={rawMetrics.would_use_yes ?? 0}
                        wouldUseMaybe={rawMetrics.would_use_maybe ?? 0}
                        wouldUseNo={rawMetrics.would_use_no ?? 0}
                      />
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 py-10 text-center text-muted-foreground">
                        <Zap className="mx-auto mb-2 h-8 w-8 opacity-20" />
                        <p className="text-sm">No responses yet — share your profile to start collecting traction.</p>
                      </div>
                    )}
                  </section>
                </div>
              </TabsContent>

              <TabsContent value="research" className="m-0 outline-none">
                <div className="space-y-6 p-6">
                  <section aria-labelledby={`rl-vis-${startup.id}`}>
                    <h3 id={`rl-vis-${startup.id}`} className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Visibility in Research Lab
                    </h3>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                      <ResearchLabToggle
                        startupId={startup.id}
                        startupName={startup.name}
                        userId={user.id}
                        existingRequestId={anyRequest?.id ?? null}
                        isCurrentlyActive={activeRequest !== null}
                      />
                    </div>
                  </section>

                  <section aria-labelledby={`rl-help-${startup.id}`}>
                    <h3 id={`rl-help-${startup.id}`} className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      How it works
                    </h3>
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm">
                      <ul className="list-inside list-disc space-y-1.5 text-xs text-blue-800">
                        <li>Use the switch above to list or remove your startup from the Research Lab anytime.</li>
                        <li>
                          Give structured feedback on three other startups to unlock reading incoming feedback on your own listings (and research breakdowns on this dashboard). You can still list in the Lab anytime using the switch above.
                        </li>
                        <li>When live, opted-in members can see your startup and leave structured feedback.</li>
                        <li>Feedback covers whether they would use it, clarity, and written notes.</li>
                      </ul>
                    </div>
                  </section>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )
      })}
    </div>
  )
}
