import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import ClaimForm from './ClaimForm'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props) {
  return { title: `Claim ${params.slug}` }
}

export default async function ClaimPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/signin?redirectTo=/claim/${params.slug}`)

  const { data: startupData } = await supabase
    .from('startups')
    .select('id, name, tagline, slug, verification_status, created_by')
    .eq('slug', params.slug)
    .single()

  const startup = startupData as any
  if (!startup) notFound()
  if (startup.created_by === user.id) redirect(`/startups/${startup.slug}`)

  // Check if already claimed
  const { data: existingClaimData } = await supabase
    .from('startup_claim_requests')
    .select('id, status')
    .eq('startup_id', startup.id)
    .eq('user_id', user.id)
    .maybeSingle()
  const existingClaim = existingClaimData as any

  return (
    <div className="container mx-auto px-4 py-16 max-w-lg">
      <div className="bg-white rounded-2xl border p-8 text-center">
        <div className="text-4xl mb-4">🔑</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Claim This Startup</h1>
        <p className="text-muted-foreground mb-2">
          <strong className="text-slate-800">{startup.name}</strong>
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          {startup.tagline}
        </p>

        {existingClaim ? (
          <div className={`rounded-2xl p-4 text-sm ${
            existingClaim.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' :
            existingClaim.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {existingClaim.status === 'approved' && 'Your claim has been approved! You now manage this startup.'}
            {existingClaim.status === 'rejected' && 'Your claim request was rejected. Contact support if you believe this is an error.'}
            {existingClaim.status === 'pending' && 'Your claim request is pending review. We\'ll notify you once it\'s processed.'}
          </div>
        ) : (
          <ClaimForm startupId={startup.id} startupSlug={startup.slug} userId={user.id} />
        )}
      </div>
    </div>
  )
}
