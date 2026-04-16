import { createClient } from '@/lib/supabase/server'
import ResearchLabClient from './ResearchLabClient'

export const metadata = {
  title: 'Research Lab',
  description: 'Give structured feedback to AI startup founders. Your input helps shape the next wave of AI products.',
}

interface Props {
  searchParams: { startup?: string }
}

export default async function ResearchLabPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let hasResearchDemographics = false

  if (user) {
    const { data: demoRow } = await supabase
      .from('research_demographics')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    hasResearchDemographics = !!demoRow
  }

  const { data: requests } = await supabase
    .from('research_requests')
    .select(`
      *,
      startups(id, name, slug, tagline, logo_path, website_url, description, verification_status, startup_stages(name), startup_categories(name))
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const requestsWithMetrics = (requests ?? []).map((r: any) => ({
    ...r,
    startups: r.startups
      ? { ...r.startups, startup_spark_score_metrics: [{}] }
      : null,
  }))

  // Feedback given on startups the user does not own (for “unlock” viewing others’ lab stats)
  let feedbackToOthersCount = 0
  let respondedIds: string[] = []
  let ownedStartupIds: string[] = []
  if (user) {
    const { data: myStartups } = await supabase.from('startups').select('id').eq('created_by', user.id)
    const ownedIds = (myStartups ?? []).map((s: { id: string }) => s.id).filter(Boolean)
    ownedStartupIds = ownedIds

    let countQuery = supabase
      .from('research_responses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    if (ownedIds.length > 0) {
      countQuery = countQuery.not('startup_id', 'in', `(${ownedIds.join(',')})`)
    }
    const { count } = await countQuery
    feedbackToOthersCount = count ?? 0

    const { data: responded } = await supabase
      .from('research_responses')
      .select('research_request_id')
      .eq('user_id', user.id)
    respondedIds = (responded as any[])?.map((r: any) => r.research_request_id) ?? []
  }

  // Find the preselected request from ?startup=slug
  const preselectedRequest = searchParams.startup
    ? requestsWithMetrics.find((r: any) => r.startups?.slug === searchParams.startup) ?? null
    : null

  return (
    <ResearchLabClient
      requests={requestsWithMetrics}
      user={user}
      hasResearchDemographics={hasResearchDemographics}
      respondedIds={respondedIds}
      feedbackToOthersCount={feedbackToOthersCount}
      ownedStartupIds={ownedStartupIds}
      preselectedRequest={preselectedRequest}
      requestedStartupSlug={searchParams.startup ?? null}
    />
  )
}
