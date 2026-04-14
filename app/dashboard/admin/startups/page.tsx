import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VerificationQueue from '../VerificationQueue'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'

export const metadata = { title: 'Admin — Startups' }

export default async function AdminStartupsPage({
  searchParams,
}: {
  searchParams: { filter?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const filter = searchParams.filter ?? 'all'

  let query = supabase
    .from('startups')
    .select('*, profiles(display_name), startup_categories(name), startup_stages(name)')
    .order('created_at', { ascending: false })

  if (filter === 'pending')  query = query.eq('verification_status', 'pending')
  if (filter === 'verified') query = query.eq('verification_status', 'verified')
  if (filter === 'rejected') query = query.eq('verification_status', 'rejected')

  const { data: startups } = await query

  const pending = (startups ?? []).filter((s: any) => s.verification_status === 'pending')
  const others  = (startups ?? []).filter((s: any) => s.verification_status !== 'pending')

  const filterTabs = [
    { key: 'all',      label: 'All' },
    { key: 'pending',  label: 'Pending' },
    { key: 'verified', label: 'Verified' },
    { key: 'rejected', label: 'Rejected' },
  ]

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Startups</h1>
        <p className="text-muted-foreground mt-0.5">Manage all submitted startups and verification queue</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {filterTabs.map(t => (
          <Link
            key={t.key}
            href={t.key === 'all' ? '/dashboard/admin/startups' : `/dashboard/admin/startups?filter=${t.key}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === t.key || (t.key === 'all' && filter === 'all')
                ? 'bg-slate-900 text-white'
                : 'bg-white border text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Pending verification queue */}
      {(filter === 'all' || filter === 'pending') && pending.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            Pending Verification
            <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">{pending.length}</span>
          </h2>
          <VerificationQueue startups={pending} />
        </div>
      )}

      {/* All other startups */}
      {(filter !== 'pending') && (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="divide-y">
            {(filter === 'all' ? others : (startups ?? [])).map((s: any) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 flex-shrink-0">
                    {s.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-slate-900 truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.startup_categories?.name} · {s.profiles?.display_name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge className={
                    s.verification_status === 'verified' ? 'bg-green-100 text-green-700 border-green-200' :
                    s.verification_status === 'pending'  ? 'bg-amber-100 text-amber-700 border-amber-200' :
                    'bg-red-100 text-red-700 border-red-200'
                  }>
                    {s.verification_status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString()}
                  </span>
                  <Link href={`/startups/${s.slug}`} target="_blank" className="text-slate-400 hover:text-orange-500">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
            {(filter === 'all' ? others : (startups ?? [])).length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">No startups found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
