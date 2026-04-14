import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UserSidebar from '@/components/user/UserSidebar'

export default async function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin?redirectTo=/dashboard/user')

  const [{ data: profileData }, { data: rolesData }, { data: scoreData }, { data: badgesData }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_roles').select('role').eq('user_id', user.id),
    (supabase as any).from('user_scores').select('total_score').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_badges' as any).select('badge_key').eq('user_id', user.id),
  ])

  const profile = profileData as any
  const roles = (rolesData as any[])?.map((r: any) => r.role) ?? ['user']
  const totalScore = (scoreData as any)?.total_score ?? 0
  const badgeKeys = (badgesData as any[])?.map((b: any) => b.badge_key) ?? []

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex gap-6 items-start">
          <UserSidebar
            profile={profile}
            roles={roles}
            totalScore={totalScore}
            badgeKeys={badgeKeys}
          />
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
