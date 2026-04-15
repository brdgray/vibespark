import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LinkButton } from '@/components/ui/link-button'
import { Badge } from '@/components/ui/badge'
import StartupCard from '@/components/startup/StartupCard'
import { ArrowRight, CheckCircle2, Zap, TrendingUp, FlaskConical, Users } from 'lucide-react'
import { fetchMetricsMap, withMetrics } from '@/lib/utils/metrics'

async function getFeaturedStartups() {
  const supabase = await createClient()
  const { data: flagged } = await supabase
    .from('startups')
    .select('*, startup_categories(name), startup_stages(name)')
    .eq('verification_status', 'verified')
    .eq('is_featured', true)
    .limit(3)

  let rows = flagged ?? []

  // If nothing is flagged featured in the DB, still show a spotlight row (top Spark)
  // so the homepage and card design are never an empty / all-plain experience.
  if (rows.length === 0) {
    const { data: pool } = await supabase
      .from('startups')
      .select('*, startup_categories(name), startup_stages(name)')
      .eq('verification_status', 'verified')
      .limit(24)
    const poolRows = pool ?? []
    const poolMetrics = await fetchMetricsMap(supabase, poolRows.map(s => s.id))
    const ranked = withMetrics(poolRows, poolMetrics)
    ranked.sort(
      (a: any, b: any) =>
        (b.startup_spark_score_metrics?.[0]?.spark_score ?? 0) -
        (a.startup_spark_score_metrics?.[0]?.spark_score ?? 0),
    )
    rows = ranked.slice(0, 3)
  } else {
    const metrics = await fetchMetricsMap(supabase, rows.map(s => s.id))
    rows = withMetrics(rows, metrics)
  }

  return rows
}

async function getTrendingStartups() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('startups')
    .select('*, startup_categories(name), startup_stages(name)')
    .eq('verification_status', 'verified')
    .limit(4)
  const rows = data ?? []
  const metrics = await fetchMetricsMap(supabase, rows.map(s => s.id))
  return withMetrics(rows, metrics)
}

async function getResearchLabStartups() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('research_requests')
    .select(`
      *,
      startups(name, slug, tagline, logo_path, verification_status, startup_stages(name))
    `)
    .eq('is_active', true)
    .limit(3)
  return data ?? []
}

export default async function HomePage() {
  const [featured, trending, researchItems] = await Promise.all([
    getFeaturedStartups(),
    getTrendingStartups(),
    getResearchLabStartups(),
  ])

  const hasEditorPicks = featured.some((s: any) => !!s.is_featured)

  const howItWorks = [
    {
      icon: <Zap className="h-6 w-6 text-orange-500" />,
      title: 'Founders Submit',
      desc: 'AI founders submit their startup with details, stage, and links.',
    },
    {
      icon: <CheckCircle2 className="h-6 w-6 text-green-500" />,
      title: 'We Verify',
      desc: 'Our team reviews each submission to ensure it\'s real, working, and accurately described.',
    },
    {
      icon: <Users className="h-6 w-6 text-blue-500" />,
      title: 'Community Votes & Tests',
      desc: 'Members vote, rate, and give structured feedback through the Research Lab.',
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-purple-500" />,
      title: 'Traction Signals Emerge',
      desc: 'Signal scores surface which startups are getting real momentum — not just hype.',
    },
  ]

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.15),transparent_50%)]" />
        <div className="container mx-auto px-4 py-24 md:py-36 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 px-3 py-1">
              Verified AI Startup Directory
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Discover AI Startups{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                Gaining Real Traction
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed">
              VibeSpark surfaces verified, AI-built products ranked by community signals — not just likes.
              Vote, test, and give feedback that actually helps founders.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <LinkButton href="/directory" size="lg" className="bg-orange-500 hover:bg-orange-600 px-8">
                Explore Directory
                <ArrowRight className="ml-2 h-4 w-4" />
              </LinkButton>
              <LinkButton
                href="/submit"
                size="lg"
                variant="outline"
                className="border-slate-600 bg-transparent text-white hover:bg-white/10 hover:text-white px-8"
              >
                Submit Your Startup
              </LinkButton>
            </div>
            <div className="flex items-center justify-center gap-8 pt-4 text-sm text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                Human verified
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-orange-400" />
                Real Spark Scores
              </div>
              <div className="flex items-center gap-1.5">
                <FlaskConical className="h-4 w-4 text-blue-400" />
                Consumer research
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Startups */}
      {featured.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Featured Startups</h2>
                <p className="text-muted-foreground mt-1">
                  Editor picks and community standouts — always shown here first.
                </p>
              </div>
              <LinkButton href="/directory?verified=true&sort=featured" variant="ghost" className="text-orange-500">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </LinkButton>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.map((s: any) => (
                <StartupCard
                  key={s.id}
                  id={s.id}
                  name={s.name}
                  slug={s.slug}
                  tagline={s.tagline}
                  logoPath={s.logo_path}
                  category={s.startup_categories?.name}
                  stage={s.startup_stages?.name}
                  verificationStatus={s.verification_status}
                  isPromoted={s.is_promoted}
                  isFeatured
                  highlightBadge={hasEditorPicks ? 'featured' : 'spotlight'}
                  sparkScore={Math.round(s.startup_spark_score_metrics?.[0]?.spark_score ?? 0)}
                  wouldUsePct={Math.round(s.startup_spark_score_metrics?.[0]?.would_use_pct ?? 0)}
                  researchCount={s.startup_spark_score_metrics?.[0]?.total_research_responses ?? 0}
                  supportCount={s.startup_spark_score_metrics?.[0]?.support_count ?? 0}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending This Week */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-orange-500" />
                Trending This Week
              </h2>
              <p className="text-muted-foreground mt-1">Startups with the strongest recent momentum</p>
            </div>
            <LinkButton href="/trending" variant="ghost" className="text-orange-500">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </LinkButton>
          </div>
          {trending.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {trending.map((s: any) => (
                <StartupCard
                  key={s.id}
                  id={s.id}
                  name={s.name}
                  slug={s.slug}
                  tagline={s.tagline}
                  logoPath={s.logo_path}
                  category={s.startup_categories?.name}
                  stage={s.startup_stages?.name}
                  verificationStatus={s.verification_status}
                  isPromoted={s.is_promoted}
                  isFeatured={!!s.is_featured}
                  sparkScore={Math.round(s.startup_spark_score_metrics?.[0]?.spark_score ?? 0)}
                  wouldUsePct={Math.round(s.startup_spark_score_metrics?.[0]?.would_use_pct ?? 0)}
                  researchCount={s.startup_spark_score_metrics?.[0]?.total_research_responses ?? 0}
                  supportCount={s.startup_spark_score_metrics?.[0]?.support_count ?? 0}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No trending startups yet. Be the first to submit!</p>
              <LinkButton href="/submit" className="mt-3 inline-block bg-orange-500 hover:bg-orange-600">
                Submit Startup
              </LinkButton>
            </div>
          )}
        </div>
      </section>

      {/* Research Lab Preview */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <FlaskConical className="h-6 w-6 text-blue-500" />
                  Research Lab
                </h2>
                <p className="text-muted-foreground mt-1">
                  Products actively seeking your feedback
                </p>
              </div>
              <LinkButton href="/research-lab" variant="ghost" className="text-orange-500">
                Give feedback <ArrowRight className="ml-1 h-4 w-4" />
              </LinkButton>
            </div>
            {researchItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {researchItems.map((r: any) => (
                  <Link key={r.id} href={`/research-lab`}>
                    <div className="rounded-2xl border bg-blue-50/50 border-blue-100 p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-2xl bg-white border flex items-center justify-center text-sm font-bold text-slate-500">
                          {r.startups?.name?.[0] ?? '?'}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{r.startups?.name}</div>
                          <div className="text-xs text-muted-foreground">{r.startups?.startup_stages?.name}</div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{r.title}</p>
                      <div className="mt-3">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          Seeking Feedback
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border bg-blue-50/30 border-blue-100 p-8 text-center text-muted-foreground">
                <FlaskConical className="h-8 w-8 mx-auto mb-3 text-blue-300" />
                <p>No active research requests yet.</p>
                <p className="text-sm mt-1">Check back soon — founders are adding products to test.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">How VibeSpark Works</h2>
            <p className="text-slate-400 mt-2">A trust-first, signal-driven platform for AI startups</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {howItWorks.map((step, i) => (
              <div key={i} className="relative">
                <div className="bg-slate-800 rounded-2xl p-6 h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
                      {i + 1}
                    </div>
                    {step.icon}
                  </div>
                  <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 text-slate-600">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-12 flex flex-col sm:flex-row gap-3 justify-center">
            <LinkButton href="/directory" size="lg" className="bg-orange-500 hover:bg-orange-600 px-8">
              Browse Directory
            </LinkButton>
            <LinkButton
              href="/auth/signup"
              size="lg"
              variant="outline"
              className="border-slate-600 text-white hover:bg-white/10 px-8"
            >
              Join the Community
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  )
}
