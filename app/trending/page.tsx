import { createClient } from '@/lib/supabase/server'
import { fetchMetricsMap, withMetrics } from '@/lib/utils/metrics'
import StartupCard from '@/components/startup/StartupCard'
import Image from 'next/image'
import Link from 'next/link'
import { TrendingUp, Flame, Zap, CheckCircle2, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'Trending',
  description: 'AI startups with the strongest momentum this week on VibeSpark.',
}

const rankStyle = (i: number) => {
  if (i === 0) return 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-200'
  if (i === 1) return 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-md shadow-slate-200'
  if (i === 2) return 'bg-gradient-to-br from-amber-700 to-amber-800 text-white shadow-md shadow-amber-100'
  return 'bg-slate-100 text-slate-500'
}

const rankLabel = (i: number) => {
  if (i === 0) return '🥇'
  if (i === 1) return '🥈'
  if (i === 2) return '🥉'
  return String(i + 1)
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

  const sorted = [...startups].sort((a: any, b: any) => {
    const at = a.startup_spark_score_metrics?.[0]?.trending_score ?? 0
    const bt = b.startup_spark_score_metrics?.[0]?.trending_score ?? 0
    return bt - at
  })

  const top10 = sorted.slice(0, 10)
  const rest = sorted.slice(10)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md shadow-orange-200">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Trending This Week</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Startups ranked by 7-day momentum — votes, saves, comments, and research activity.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 space-y-12">
        {sorted.length === 0 ? (
          <div className="bg-white rounded-3xl border p-20 text-center text-muted-foreground">
            <Flame className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-semibold text-slate-700">No trending startups yet</p>
            <p className="text-sm mt-1.5">Startups will appear here as they gain community traction.</p>
          </div>
        ) : (
          <>
            {/* Top 10 leaderboard */}
            {top10.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <h2 className="text-xl font-bold text-slate-900">Top 10 This Week</h2>
                </div>

                <div className="space-y-3">
                  {top10.map((startup: any, i: number) => {
                    const m = startup.startup_spark_score_metrics?.[0] ?? {}
                    const isVerified = startup.verification_status === 'verified'
                    const isPodium = i < 3

                    return (
                      <Link
                        key={startup.id}
                        href={`/startups/${startup.slug}`}
                        className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-3xl"
                      >
                        <div className={cn(
                          'relative flex items-center gap-4 px-5 py-4 rounded-3xl border bg-white',
                          'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-orange-200',
                          isPodium && 'border-orange-100',
                        )}>
                          {/* Top accent bar for podium */}
                          {isPodium && (
                            <div className={cn(
                              'absolute top-0 left-0 right-0 h-[3px] rounded-t-3xl',
                              i === 0 ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                              i === 1 ? 'bg-gradient-to-r from-slate-300 to-slate-400' :
                                        'bg-gradient-to-r from-amber-700 to-amber-600'
                            )} />
                          )}

                          {/* Rank badge */}
                          <div className={cn(
                            'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                            rankStyle(i)
                          )}>
                            {i < 3 ? rankLabel(i) : <span className="text-xs">{i + 1}</span>}
                          </div>

                          {/* Logo */}
                          <div className="w-11 h-11 rounded-2xl bg-slate-50 border flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                            {startup.logo_path ? (
                              <Image
                                src={startup.logo_path}
                                alt={`${startup.name} logo`}
                                width={44}
                                height={44}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <span className="text-base font-bold text-slate-400 select-none">
                                {startup.name[0]}
                              </span>
                            )}
                          </div>

                          {/* Name + tagline + tags */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 group-hover:text-orange-500 transition-colors">
                                {startup.name}
                              </span>
                              {isVerified && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                              )}
                              {startup.startup_categories?.name && (
                                <span className="hidden sm:inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                  {startup.startup_categories.name}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 truncate mt-0.5">{startup.tagline}</p>
                          </div>

                          {/* Metrics */}
                          <div className="hidden sm:flex items-stretch gap-5 shrink-0">
                            <div className="flex flex-col items-center justify-center min-w-[52px]">
                              <div className="flex items-center gap-0.5 text-orange-500">
                                <Zap className="h-3 w-3 fill-current" />
                                <span className="text-sm font-bold tabular-nums">{Math.round(m.spark_score ?? 0)}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground mt-0.5">Spark</span>
                            </div>
                            <div className="border-l border-slate-100" />
                            <div className="flex flex-col items-center justify-center min-w-[52px]">
                              <div className="flex items-center gap-0.5 text-slate-700">
                                <ArrowUp className="h-3 w-3 text-orange-400" />
                                <span className="text-sm font-bold tabular-nums">{m.activity_7d ?? 0}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground mt-0.5">7d Activity</span>
                            </div>
                            <div className="border-l border-slate-100" />
                            <div className="flex flex-col items-center justify-center min-w-[52px]">
                              <span className="text-sm font-bold text-green-600 tabular-nums">
                                {Math.round(m.would_use_pct ?? 0)}%
                              </span>
                              <span className="text-[10px] text-muted-foreground mt-0.5">Would Use</span>
                            </div>
                          </div>

                          {/* Mobile compact metric */}
                          <div className="sm:hidden flex flex-col items-center shrink-0">
                            <div className="flex items-center gap-0.5 text-orange-500">
                              <Zap className="h-3 w-3 fill-current" />
                              <span className="text-sm font-bold tabular-nums">{Math.round(m.spark_score ?? 0)}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">Spark</span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Rest as cards */}
            {rest.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-5">More Trending</h2>
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
                      supportCount={startup.startup_spark_score_metrics?.[0]?.support_count ?? 0}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
