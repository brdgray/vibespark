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

  let isResearchParticipant = false

  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_research_participant')
      .eq('id', user.id)
      .single()
    const profile = profileData as any
    isResearchParticipant = profile?.is_research_participant ?? false
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

  // Get user's already-responded request ids
  let respondedIds: string[] = []
  if (user) {
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
      isResearchParticipant={isResearchParticipant}
      respondedIds={respondedIds}
      preselectedRequest={preselectedRequest}
      requestedStartupSlug={searchParams.startup ?? null}
    />
  )
}
