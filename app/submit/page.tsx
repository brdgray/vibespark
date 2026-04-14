import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubmitStartupForm from './SubmitStartupForm'

export const metadata = {
  title: 'Submit Your Startup',
  description: 'Submit your AI-built startup to the VibeSpark directory.',
}

export default async function SubmitPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin?redirectTo=/submit')

  const [{ data: categories }, { data: stages }] = await Promise.all([
    supabase.from('startup_categories').select('*').order('name'),
    supabase.from('startup_stages').select('*').order('sort_order'),
  ])

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Submit Your Startup</h1>
        <p className="text-muted-foreground mt-1.5">
          Add your AI-built startup to the VibeSpark directory. It will be reviewed before going live.
        </p>
      </div>
      <SubmitStartupForm
        userId={user.id}
        categories={categories ?? []}
        stages={stages ?? []}
      />
    </div>
  )
}
