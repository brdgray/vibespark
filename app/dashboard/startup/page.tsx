import { createClient } from '@/lib/supabase/server'
import { fetchMetricsMap } from '@/lib/utils/metrics'
import { redirect } from 'next/navigation'
import { LinkButton } from '@/components/ui/link-button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Clock, XCircle, AlertCircle, Plus, TrendingUp, FlaskConical, Zap } from 'lucide-react'
import StartupMetricsChart from './StartupMetricsChart'
import StageBadge from '@/components/startup/StageBadge'
import SparkScore from '@/components/startup/SparkScore'
import ResearchLabToggle from './ResearchLabToggle'

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

  // Count how many other startups this founder has given feedback on
  const { count: feedbackGivenCount } = await supabase
    .from('research_responses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('startup_id', 'in', `(${ids.join(',') || '00000000-0000-0000-0000-000000000000'})`)

  const feedbackCount = feedbackGivenCount ?? 0

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
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Startup Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track traction and community signals</p>
        </div>
        <LinkButton href="/submit" className="bg-orange-500 hover:bg-orange-600">
          <Plus className="mr-1.5 h-4 w-4" /> Add Startup
        </LinkButton>
      </div>

      {startups.map((startup: any) => {
        const metrics = startup.startup_spark_score_metrics?.[0] ?? {}
        const status = statusConfig[startup.verification_status as keyof typeof statusConfig] ?? statusConfig.pending
        const StatusIcon = status.icon

        // Research request for this startup
        const activeRequest = startup.research_requests?.find((r: any) => r.is_active) ?? null
        const anyRequest = startup.research_requests?.[0] ?? null

        return (
          <div key={startup.id} className="mb-10">
            {/* Startup header */}
            <div className="bg-white rounded-2xl border p-6 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-900">{startup.name}</h2>
                    <Badge className={`text-xs ${status.color}`}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {status.label}
                    </Badge>
                    {startup.is_promoted && (
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">Promoted</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">{startup.tagline}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {startup.startup_stages?.name && <StageBadge stage={startup.startup_stages.name} />}
                    {startup.startup_categories?.name && (
                      <Badge variant="secondary" className="text-xs">{startup.startup_categories.name}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <LinkButton href={`/startups/${startup.slug}`} variant="outline" size="sm">
                    View Profile
                  </LinkButton>
                </div>
              </div>
            </div>

            <Tabs defaultValue="metrics">
              <TabsList className="mb-4">
                <TabsTrigger value="metrics">
                  <TrendingUp className="mr-1.5 h-4 w-4" /> Analytics
                </TabsTrigger>
                <TabsTrigger value="research">
                  <FlaskConical className="mr-1.5 h-4 w-4" /> Research Lab
                </TabsTrigger>
              </TabsList>

              <TabsContent value="metrics">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Spark Score',         value: <SparkScore score={Math.round(metrics.spark_score ?? 0)} size="sm" />, bg: 'bg-white' },
                    { label: 'Would Use',            value: <span className="text-lg font-bold text-green-600">{Math.round(metrics.would_use_pct ?? 0)}%</span>, bg: 'bg-white' },
                    { label: 'Supporters',           value: <span className="text-lg font-bold text-orange-500">{metrics.support_count ?? 0}</span>, bg: 'bg-white' },
                    { label: 'Research Responses',   value: <span className="text-lg font-bold text-blue-500">{metrics.total_research_responses ?? 0}</span>, bg: 'bg-white' },
                    { label: 'Saves',                value: <span className="text-lg font-bold text-slate-700">{metrics.save_count ?? 0}</span>, bg: 'bg-white' },
                    { label: 'Comments',             value: <span className="text-lg font-bold text-slate-700">{metrics.total_comments ?? 0}</span>, bg: 'bg-white' },
                    { label: 'Avg Rating',           value: <span className="text-lg font-bold text-slate-700">{metrics.avg_rating ? Number(metrics.avg_rating).toFixed(1) : '—'}</span>, bg: 'bg-white' },
                    { label: '7d Activity',          value: <span className="text-lg font-bold text-purple-500">{metrics.activity_7d ?? 0}</span>, bg: 'bg-white' },
                  ].map(stat => (
                    <div key={stat.label} className={`${stat.bg} rounded-2xl border p-4`}>
                      <div className="mb-1">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {(metrics.would_use_yes || metrics.would_use_maybe || metrics.would_use_no) ? (
                  <StartupMetricsChart
                    wouldUseYes={metrics.would_use_yes ?? 0}
                    wouldUseMaybe={metrics.would_use_maybe ?? 0}
                    wouldUseNo={metrics.would_use_no ?? 0}
                  />
                ) : (
                  <Card>
                    <CardContent className="py-10 text-center text-muted-foreground">
                      <Zap className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No responses yet. Share your startup to start collecting traction!</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="research">
                <div className="space-y-4">
                  <ResearchLabToggle
                    startupId={startup.id}
                    startupName={startup.name}
                    userId={user.id}
                    existingRequestId={anyRequest?.id ?? null}
                    isCurrentlyActive={activeRequest !== null}
                    feedbackGivenCount={feedbackCount}
                  />

                  <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 text-sm text-blue-700">
                    <p className="font-medium mb-1">How Research Lab works</p>
                    <ul className="space-y-1 text-blue-600 text-xs list-disc list-inside">
                      <li>Give feedback on {3 - Math.min(feedbackCount, 3)} more startup{(3 - Math.min(feedbackCount, 3)) !== 1 ? 's' : ''} to unlock</li>
                      <li>Once active, opted-in community members see your startup and give structured feedback</li>
                      <li>Feedback includes whether they would use it, clarity score, and written notes</li>
                      <li>All responses are segmented by demographic (job title, industry, etc.)</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )
      })}
    </div>
  )
}
