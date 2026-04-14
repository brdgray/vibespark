import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Rocket, Users, Flag, MessageSquare, Zap, CheckCircle2, Clock, ArrowRight, Mail } from 'lucide-react'

export const metadata = { title: 'Admin — Overview' }

export default async function AdminOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: roleRow } = await supabase
    .from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle()
  if (!roleRow) redirect('/')

  const [
    { count: pendingCount },
    { count: verifiedCount },
    { count: totalUsersCount },
    { count: openReportsCount },
    { count: flaggedCommentsCount },
    { count: activePromotionsCount },
    { count: contactNewCount },
    { data: recentStartups },
  ] = await Promise.all([
    supabase.from('startups').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    supabase.from('startups').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('startup_comments').select('*', { count: 'exact', head: true }).eq('status', 'flagged'),
    supabase.from('promotions').select('*', { count: 'exact', head: true }).eq('is_active', true),
    (supabase.from('contact_submissions') as any).select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('startups')
      .select('id, name, slug, verification_status, created_at, startup_categories(name)')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const statCards = [
    { label: 'Pending Review',    value: pendingCount ?? 0,          icon: Clock,        color: 'bg-amber-50 text-amber-600 border-amber-200',   href: '/dashboard/admin/startups?filter=pending' },
    { label: 'Verified Startups', value: verifiedCount ?? 0,         icon: CheckCircle2, color: 'bg-green-50 text-green-600 border-green-200',    href: '/dashboard/admin/startups' },
    { label: 'Total Users',       value: totalUsersCount ?? 0,        icon: Users,        color: 'bg-blue-50 text-blue-600 border-blue-200',       href: '/dashboard/admin/users' },
    { label: 'Open Reports',      value: openReportsCount ?? 0,       icon: Flag,         color: 'bg-red-50 text-red-600 border-red-200',          href: '/dashboard/admin/moderation' },
    { label: 'Flagged Comments',  value: flaggedCommentsCount ?? 0,   icon: MessageSquare,color: 'bg-purple-50 text-purple-600 border-purple-200', href: '/dashboard/admin/moderation' },
    { label: 'Active Promotions', value: activePromotionsCount ?? 0,  icon: Zap,          color: 'bg-orange-50 text-orange-600 border-orange-200', href: '/dashboard/admin/promotions' },
    { label: 'Contact Inbox',     value: contactNewCount ?? 0,        icon: Mail,         color: 'bg-cyan-50 text-cyan-600 border-cyan-200',       href: '/dashboard/admin/contact' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="text-muted-foreground mt-0.5">Platform health at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {statCards.map(s => (
          <Link key={s.label} href={s.href}
            className={`rounded-2xl border p-5 flex items-center gap-4 hover:shadow-sm transition-shadow ${s.color} bg-opacity-50`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs font-medium mt-0.5 opacity-80">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent startups */}
      <div className="bg-white rounded-2xl border">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-slate-900">Recent Submissions</h2>
          <Link href="/dashboard/admin/startups" className="text-sm text-orange-500 hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="divide-y">
          {(recentStartups ?? []).map((s: any) => (
            <div key={s.id} className="flex items-center justify-between px-6 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-600 flex-shrink-0">
                  {s.name[0]}
                </div>
                <div className="min-w-0">
                  <Link href={`/startups/${s.slug}`} className="text-sm font-medium text-slate-900 hover:text-orange-500 truncate block">
                    {s.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">{s.startup_categories?.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  s.verification_status === 'verified' ? 'bg-green-100 text-green-700' :
                  s.verification_status === 'pending'  ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {s.verification_status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
