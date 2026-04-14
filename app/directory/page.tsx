import { createClient } from '@/lib/supabase/server'
import { fetchMetricsMap, withMetrics } from '@/lib/utils/metrics'
import DirectoryClient from './DirectoryClient'

async function getDirectoryData() {
  const supabase = await createClient()

  const [{ data: rawStartups }, { data: categories }, { data: stages }] = await Promise.all([
    supabase
      .from('startups')
      .select('*, startup_categories(id, name, slug), startup_stages(id, name, slug, sort_order)')
      .eq('verification_status', 'verified')
      .order('created_at', { ascending: false }),
    supabase.from('startup_categories').select('*').order('name'),
    supabase.from('startup_stages').select('*').order('sort_order'),
  ])

  const rows = rawStartups ?? []
  const metrics = await fetchMetricsMap(supabase, rows.map(s => s.id))
  const startups = withMetrics(rows, metrics)

  return { startups, categories: categories ?? [], stages: stages ?? [] }
}

export const metadata = {
  title: 'Directory',
  description: 'Browse all verified AI-built startups on VibeSpark.',
}

export default async function DirectoryPage() {
  const { startups, categories, stages } = await getDirectoryData()
  return <DirectoryClient startups={startups} categories={categories} stages={stages} />
}
