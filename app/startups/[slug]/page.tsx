import { createClient } from '@/lib/supabase/server'
import { fetchMetricsMap } from '@/lib/utils/metrics'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Globe, ExternalLink, Users, MapPin, Calendar, Link2, DollarSign, Target, Cpu, PencilLine } from 'lucide-react'
import StageBadge from '@/components/startup/StageBadge'
import SparkScore from '@/components/startup/SparkScore'
import StartupActions from '@/components/startup/StartupActions'
import CommentsSection from '@/components/startup/CommentsSection'
import SparkScoreChart from '@/components/startup/SparkScoreChart'
import ScreenshotGallery from '@/components/startup/ScreenshotGallery'
import {
  fetchFeedbackToOthersCount,
  founderResearchGivebackMet,
  RESEARCH_GIVEBACK_REQUIRED,
} from '@/lib/utils/research-giveback'
import { LinkButton } from '@/components/ui/link-button'
import type { WouldUse } from '@/lib/supabase/types'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('startups')
    .select('name, tagline')
    .eq('slug', params.slug)
    .single()
  const startup = data as any
  if (!startup) return { title: 'Startup Not Found' }
  return {
    title: startup.name,
    description: startup.tagline,
  }
}

const pricingLabels: Record<string, { label: string; color: string }> = {
  free:        { label: 'Free', color: 'bg-green-100 text-green-700' },
  freemium:    { label: 'Freemium', color: 'bg-blue-100 text-blue-700' },
  paid:        { label: 'Paid', color: 'bg-purple-100 text-purple-700' },
  enterprise:  { label: 'Enterprise', color: 'bg-slate-100 text-slate-700' },
  'open-source': { label: 'Open Source', color: 'bg-emerald-100 text-emerald-700' },
}

export default async function StartupProfilePage({ params }: Props) {
  const supabase = await createClient()

  const { data: startupData } = await supabase
    .from('startups')
    .select(`
      *,
      startup_categories(name),
      startup_stages(name),
      startup_social_links(*),
      startup_team_members(*),
      startup_comments(*, profiles(display_name, avatar_url))
    `)
    .eq('slug', params.slug)
    .single()

  const { data: { user } } = await supabase.auth.getUser()
  const startup = startupData as any
  if (!startup || startup.verification_status === 'rejected') notFound()

  // Hide inactive/suspended startups from live profile except owner/admin.
  if (startup.verification_status === 'inactive' || startup.verification_status === 'suspended') {
    const isOwner = !!(user && startup.created_by === user.id)
    let isAdmin = false
    if (user && !isOwner) {
      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle()
      isAdmin = !!roleRow
    }
    if (!isOwner && !isAdmin) notFound()
  }

  // Fetch metrics separately (view — no FK for auto-join)
  const metricsMap = await fetchMetricsMap(supabase, [startup.id])
  startup.startup_spark_score_metrics = [metricsMap[startup.id] ?? {}]

  const isOwnerProfile = !!(user && startup.created_by === user.id)
  const feedbackToOthersCount = user ? await fetchFeedbackToOthersCount(supabase, user.id) : 0
  const ownerGivebackMet = founderResearchGivebackMet(feedbackToOthersCount)
  const hideOwnIncomingResearch = isOwnerProfile && !ownerGivebackMet

  let hasVoted = false
  let hasSaved = false
  let profileWouldUse: WouldUse | null = null
  let labWouldUseForMetrics: WouldUse | null = null

  if (user) {
    const [{ data: vote }, { data: save }] = await Promise.all([
      supabase.from('startup_votes').select('id').eq('startup_id', startup.id).eq('user_id', user.id).maybeSingle(),
      supabase.from('startup_saves').select('id').eq('startup_id', startup.id).eq('user_id', user.id).maybeSingle(),
    ])
    hasVoted = !!vote
    hasSaved = !!save
  }

  if (user && !isOwnerProfile) {
    const [{ data: prof }, { data: labRows }] = await Promise.all([
      supabase.from('startup_profile_would_use').select('would_use').eq('startup_id', startup.id).eq('user_id', user.id).maybeSingle(),
      supabase.from('research_responses').select('would_use').eq('startup_id', startup.id).eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
    ])
    profileWouldUse = ((prof as { would_use: WouldUse } | null)?.would_use) ?? null
    const firstLab = labRows?.[0] as { would_use: WouldUse } | undefined
    labWouldUseForMetrics = firstLab?.would_use ?? null
  }

  // Research insights (owners without give-back see nothing here)
  const { data: demoSummaryRaw } = hideOwnIncomingResearch
    ? { data: [] as any[] }
    : await supabase
        .from('startup_demographic_summary')
        .select('*')
        .eq('startup_id', startup.id)
        .limit(10)
  const demoSummary = demoSummaryRaw ?? []

  // Spark score history (last 30 days)
  const { data: scoreHistory } = await supabase
    .from('startup_spark_score_history')
    .select('spark_score, recorded_date')
    .eq('startup_id', startup.id)
    .order('recorded_date', { ascending: true })
    .limit(30)

  // Screenshots
  const { data: screenshots } = await supabase
    .from('startup_screenshots')
    .select('id, storage_path, display_order')
    .eq('startup_id', startup.id)
    .order('display_order', { ascending: true })

  const rawMetrics = startup.startup_spark_score_metrics?.[0] ?? {
    spark_score: 0, would_use_pct: 0, would_use_yes: 0, would_use_maybe: 0, would_use_no: 0,
    total_comments: 0, total_research_responses: 0, support_count: 0, save_count: 0, avg_rating: null,
  }
  /** Hide only raw response count for locked owners; would-use % is public like the directory. */
  const metrics = hideOwnIncomingResearch
    ? { ...rawMetrics, total_research_responses: 0 }
    : rawMetrics

  const publishedComments = startup.startup_comments?.filter(
    (c: any) => !c.parent_comment_id && c.status === 'published'
  ) ?? []

  const platformIcons: Record<string, React.ReactNode> = {
    twitter: <Link2 className="h-4 w-4" />,
    x: <Link2 className="h-4 w-4" />,
    linkedin: <Link2 className="h-4 w-4" />,
    website: <Globe className="h-4 w-4" />,
    'product hunt': <ExternalLink className="h-4 w-4" />,
  }

  // Split description into paragraphs
  const paragraphs = (startup.description ?? '').split(/\n+/).filter(Boolean)

  const pricing = pricingLabels[startup.pricing_model] ?? null

  const isOwner = user && startup.created_by === user.id

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Owner edit banner */}
      {isOwner && (
        <div className="bg-orange-50 border-b border-orange-200">
          <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-orange-700">
              <PencilLine className="h-4 w-4 shrink-0" />
              <span className="font-medium">This is your startup</span>
              <span className="text-orange-500 hidden sm:inline">— manage it from your dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/startup/${startup.id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-full border border-orange-300 bg-white text-orange-700 hover:bg-orange-100 text-xs font-semibold px-3 py-1.5 transition-colors"
              >
                <PencilLine className="h-3 w-3" /> Edit Profile
              </Link>
              <Link
                href="/dashboard/startup"
                className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 transition-colors"
              >
                <PencilLine className="h-3 w-3" /> Edit &amp; Manage
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-20 h-20 flex-shrink-0 rounded-2xl border bg-white shadow-sm overflow-hidden flex items-center justify-center">
              {startup.logo_path ? (
                <Image src={startup.logo_path} alt={startup.name} width={80} height={80} className="object-contain" />
              ) : (
                <span className="text-3xl font-bold text-slate-300">{startup.name[0]}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-slate-900">{startup.name}</h1>
                {startup.verification_status === 'verified' && (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                )}
                {startup.is_promoted && (
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200">Promoted</Badge>
                )}
              </div>
              <p className="text-lg text-slate-600 mb-3">{startup.tagline}</p>
              <div className="flex flex-wrap gap-2 items-center">
                {startup.startup_stages?.name && <StageBadge stage={startup.startup_stages.name} />}
                {startup.startup_categories?.name && (
                  <Badge variant="secondary">{startup.startup_categories.name}</Badge>
                )}
                {pricing && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${pricing.color}`}>
                    <DollarSign className="h-3 w-3" />{pricing.label}
                  </span>
                )}
                {startup.founded_at && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Founded {new Date(startup.founded_at).getFullYear()}
                  </span>
                )}
                {startup.location && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {startup.location}
                  </span>
                )}
                {startup.website_url && (
                  <a href={startup.website_url} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-orange-500 hover:underline flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" /> Visit Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Screenshot gallery */}
            {screenshots && screenshots.length > 0 && (
              <ScreenshotGallery screenshots={screenshots} startupName={startup.name} />
            )}

            {/* About */}
            <section className="bg-white rounded-2xl border overflow-hidden">
              <div className="px-6 pt-6 pb-4 border-b bg-slate-50/50">
                <h2 className="text-lg font-semibold text-slate-900">About</h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Description */}
                <div className="space-y-4">
                  {paragraphs.map((p: string, i: number) => (
                    <p key={i} className="text-slate-700 leading-relaxed text-[15px]">{p}</p>
                  ))}
                </div>

                {/* Key details chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                  {startup.target_audience && (
                    <div className="flex gap-3 items-start">
                      <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Target className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Target Audience</div>
                        <div className="text-sm text-slate-700 leading-snug">{startup.target_audience}</div>
                      </div>
                    </div>
                  )}
                  {startup.team_size && (
                    <div className="flex gap-3 items-start">
                      <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                        <Users className="h-4 w-4 text-purple-500" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Team Size</div>
                        <div className="text-sm text-slate-700">{startup.team_size} {startup.team_size === 1 ? 'person' : 'people'}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Stack */}
                {startup.ai_stack && startup.ai_stack.length > 0 && (
                  <div className="pt-2 border-t">
                    <div className="flex gap-3 items-start">
                      <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                        <Cpu className="h-4 w-4 text-orange-500" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">AI Stack</div>
                        <div className="flex flex-wrap gap-1.5">
                          {startup.ai_stack.map((tech: string) => (
                            <span key={tech} className="inline-flex items-center rounded-full bg-orange-50 border border-orange-200 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Community Feedback / Comments */}
            <CommentsSection
              startupId={startup.id}
              comments={publishedComments}
              user={user}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* CTA Actions */}
            <StartupActions
              startupId={startup.id}
              startupSlug={startup.slug}
              websiteUrl={startup.website_url}
              user={user}
              hasVoted={hasVoted}
              hasSaved={hasSaved}
              profileWouldUse={profileWouldUse}
              labWouldUseForMetrics={labWouldUseForMetrics}
              isOwnerProfile={isOwnerProfile}
            />

            {/* Spark Score */}
            <div className="bg-white rounded-2xl border p-5 space-y-4">
              {hideOwnIncomingResearch && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <p className="font-semibold">Detailed Research Lab data is locked</p>
                  <p className="mt-1 text-amber-800">
                    Give {RESEARCH_GIVEBACK_REQUIRED - feedbackToOthersCount} more structured feedback on other startups to unlock response counts, written notes, and demographic insights for your own product. Would-use % stays visible for everyone.
                  </p>
                  <LinkButton href="/research-lab" size="sm" variant="outline" className="mt-2 border-amber-300 text-amber-900">
                    Research Lab
                  </LinkButton>
                </div>
              )}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Spark Score</h3>
                <SparkScore score={Math.round(metrics.spark_score ?? 0)} size="lg" />
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Would Use</span>
                  <span className="font-medium text-green-600">
                    {Math.round(rawMetrics.would_use_pct ?? 0)}%
                  </span>
                </div>
                {(rawMetrics.would_use_yes + rawMetrics.would_use_maybe + rawMetrics.would_use_no) > 0 && (
                  <div className="space-y-1.5">
                    {[
                      { label: 'Yes', count: rawMetrics.would_use_yes, color: 'bg-green-500' },
                      { label: 'Maybe', count: rawMetrics.would_use_maybe, color: 'bg-amber-400' },
                      { label: 'No', count: rawMetrics.would_use_no, color: 'bg-slate-300' },
                    ].map(item => {
                      const total = rawMetrics.would_use_yes + rawMetrics.would_use_maybe + rawMetrics.would_use_no
                      const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
                      return (
                        <div key={item.label} className="flex items-center gap-2 text-xs">
                          <span className="w-10 text-muted-foreground">{item.label}</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-8 text-right text-muted-foreground">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-sm pt-1">
                  {[
                    { label: 'Supporters', value: metrics.support_count },
                    { label: 'Saved', value: metrics.save_count },
                    { label: 'Comments', value: metrics.total_comments },
                    {
                      label: 'Research',
                      value: hideOwnIncomingResearch ? '—' : (rawMetrics.total_research_responses ?? 0),
                    },
                  ].map(stat => (
                    <div key={stat.label} className="text-center bg-slate-50 rounded-xl p-2">
                      <div className="font-bold text-slate-800">{stat.value ?? 0}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
                {metrics.avg_rating && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Rating</span>
                    <span className="font-medium">{'⭐'.repeat(Math.round(metrics.avg_rating))} {Number(metrics.avg_rating).toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Spark Score History Chart */}
            {scoreHistory && scoreHistory.length > 1 && (
              <SparkScoreChart history={scoreHistory} />
            )}

            {/* Research Insights */}
            {demoSummary && demoSummary.length > 0 && (
              <div className="bg-white rounded-2xl border p-5 space-y-4">
                <h3 className="font-semibold text-slate-900">Research Insights</h3>
                <div className="space-y-3 text-sm">
                  {Object.entries(
                    demoSummary.reduce((acc: any, row: any) => {
                      if (!acc[row.persona_type]) acc[row.persona_type] = { yes: 0, maybe: 0, no: 0 }
                      acc[row.persona_type].yes += row.yes_count
                      acc[row.persona_type].maybe += row.maybe_count
                      acc[row.persona_type].no += row.no_count
                      return acc
                    }, {})
                  ).slice(0, 4).map(([persona, counts]: [string, any]) => {
                    const total = counts.yes + counts.maybe + counts.no
                    const yesPct = total > 0 ? Math.round((counts.yes / total) * 100) : 0
                    return (
                      <div key={persona}>
                        <div className="flex justify-between mb-0.5">
                          <span className="capitalize text-slate-700">{persona}s</span>
                          <span className="text-green-600 font-medium">{yesPct}% would use</span>
                        </div>
                        <Progress value={yesPct} className="h-1.5" />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Social Links */}
            {startup.startup_social_links && startup.startup_social_links.length > 0 && (
              <div className="bg-white rounded-2xl border p-5">
                <h3 className="font-semibold text-slate-900 mb-3">Links</h3>
                <div className="space-y-2">
                  {startup.startup_social_links.map((link: any) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-slate-600 hover:text-orange-500 transition-colors"
                    >
                      {platformIcons[link.platform.toLowerCase()] ?? <Globe className="h-4 w-4" />}
                      <span className="capitalize">{link.platform}</span>
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Team */}
            {startup.startup_team_members &&
              startup.startup_team_members.filter((m: any) => m.is_public).length > 0 && (
              <div className="bg-white rounded-2xl border p-5">
                <h3 className="font-semibold text-slate-900 mb-3">Team</h3>
                <div className="space-y-3">
                  {startup.startup_team_members.filter((m: any) => m.is_public).map((member: any) => (
                    <div key={member.id} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm font-semibold text-orange-700">
                        {member.name[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-800">{member.name}</div>
                        {member.title && <div className="text-xs text-muted-foreground">{member.title}</div>}
                      </div>
                      {member.linkedin_url && (
                        <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="ml-auto">
                          <Link2 className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Claim */}
            {startup.verification_status === 'pending' && !isOwner && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-sm">
                <p className="font-medium text-orange-700">Is this your startup?</p>
                <p className="text-orange-600 mt-0.5">
                  <Link href={`/claim/${startup.slug}`} className="underline">Claim this profile</Link> to manage it and start collecting traction signals.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
