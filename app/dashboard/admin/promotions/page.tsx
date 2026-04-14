import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PromotionsManager from '../PromotionsManager'

export const metadata = { title: 'Admin — Promotions' }

export default async function AdminPromotionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: promotions } = await supabase
    .from('promotions')
    .select('*, startups(name, slug)')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Promotions</h1>
        <p className="text-muted-foreground mt-0.5">Manage featured and promoted startup slots</p>
      </div>
      <PromotionsManager promotions={promotions ?? []} />
    </div>
  )
}
