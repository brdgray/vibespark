import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import EditStartupForm from './EditStartupForm'

interface Props {
  params: { id: string }
}

export const metadata = { title: 'Edit Startup' }

export default async function EditStartupPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const [{ data: startup }, { data: categories }, { data: stages }] = await Promise.all([
    supabase
      .from('startups')
      .select(`
        *,
        startup_social_links(*),
        startup_team_members(*)
      `)
      .eq('id', params.id)
      .maybeSingle(),
    supabase.from('startup_categories').select('id, name').order('name', { ascending: true }),
    supabase.from('startup_stages').select('id, name, sort_order').order('sort_order', { ascending: true }),
  ])

  const typedStartup = startup as any
  if (!typedStartup) notFound()
  if (typedStartup.created_by !== user.id) redirect('/dashboard/startup')

  const { data: screenshots } = await supabase
    .from('startup_screenshots')
    .select('id, storage_path, display_order')
    .eq('startup_id', typedStartup.id)
    .order('display_order', { ascending: true })

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Edit Startup Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your public profile, logo, links, and screenshots.
        </p>
      </div>

      <EditStartupForm
        startup={typedStartup}
        categories={(categories ?? []) as any[]}
        stages={(stages ?? []) as any[]}
        screenshots={(screenshots ?? []) as any[]}
      />
    </div>
  )
}
