import { createClient } from '@/lib/supabase/server'
import { fetchMetricsMap, withMetrics } from '@/lib/utils/metrics'
import StartupCard from '@/components/startup/StartupCard'
import Image from 'next/image'
import { TrendingUp, Flame } from 'lucide-react'

export const metadata = {
  title: 'Trending',
  description: 'AI startups with the strongest momentum this week on VibeSpark.',
}

export default async function TrendingPage() {
  const supabase = await createClient()

  const { data: rawStartups } = await supabase
    .from('startups')
    .select('*, startup_categories(name), startup_stages(name)')
    .eq('verification_status', 'verified')
    .order('created_at', { ascending: false })

  const rows = rawStartups ?? []
  const metricsMap = await fetchMetricsMap(supabase, rows.map((s: any) => s.id))
  const startups = withMetrics(rows, metricsMap)

  const sorted = startups.sort((a: any, b: any) => {
    const at = a.startup_spark_score_metrics?.[0]?.trending_score ?? 0
    const bt = b.startup_spark_score_metrics?.[0]?.trending_score ?? 0
    return bt - at
  })

  const top10 = sorted.slice(0, 10)
  const rest = sorted.slice(10)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-orange-500" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Trending This Week</h1>
          </div>
          <p className="text-muted-foreground">
            Startups ranked by 7-day momentum — votes, saves, comments, and research activity.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {sorted.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Flame className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No trending startups yet</p>
            <p className="text-sm">Startups will appear here as they gain community traction.</p>
          </div>
        ) : (
          <>
            {/* Top 10 ranked list */}
            {top10.length > 0 && (
              <div className="mb-10">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  Top 10 This Week
                </h2>
                <div className="space-y-3">
                  {top10.map((startup: any, i: number) => {
                    const metrics = startup.startup_spark_score_metrics?.[0] ?? {}
                    return (
                      <div key={startup.id} className="bg-white rounded-2xl border hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-4 p-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            i === 0 ? 'bg-amber-400 text-white' :
                            i === 1 ? 'bg-slate-300 text-slate-700' :
                            i === 2 ? 'bg-amber-700 text-white' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {i + 1}
                          </div>
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 flex-shrink-0">
                            {startup.logo_path ? (
                              <Image src={startup.logo_path} alt="" width={40} height={40} className="w-full h-full object-contain rounded-2xl" />
                            ) : startup.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <a href={`/startups/${startup.slug}`} className="font-semibold text-slate-900 hover:text-orange-500">
                              {startup.name}
                            </a>
                            <p className="text-sm text-muted-foreground truncate">{startup.tagline}</p>
                          </div>
                          <div className="hidden sm:flex items-center gap-6 text-sm flex-shrink-0">
                            <div className="text-center">
                              <div className="font-bold text-orange-500">{Math.round(metrics.trending_score ?? 0)}</div>
                              <div className="text-xs text-muted-foreground">Trending</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-green-600">{Math.round(metrics.would_use_pct ?? 0)}%</div>
                              <div className="text-xs text-muted-foreground">Would Use</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-slate-700">{metrics.activity_7d ?? 0}</div>
                              <div className="text-xs text-muted-foreground">7d Activity</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Rest as cards */}
            {rest.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-4">More Trending</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {rest.map((startup: any) => (
                    <StartupCard
                      key={startup.id}
                      id={startup.id}
                      name={startup.name}
                      slug={startup.slug}
                      tagline={startup.tagline}
                      logoPath={startup.logo_path}
                      category={startup.startup_categories?.name}
                      stage={startup.startup_stages?.name}
                      verificationStatus={startup.verification_status}
                      sparkScore={Math.round(startup.startup_spark_score_metrics?.[0]?.spark_score ?? 0)}
                      wouldUsePct={Math.round(startup.startup_spark_score_metrics?.[0]?.would_use_pct ?? 0)}
                      researchCount={startup.startup_spark_score_metrics?.[0]?.total_research_responses ?? 0}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
