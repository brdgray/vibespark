import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileEditClient from './ProfileEditClient'

export const metadata = { title: 'Edit Profile' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const [{ data: profileData }, { data: demographicsData }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('research_demographics').select('*').eq('user_id', user.id).maybeSingle(),
  ])

  return (
    <ProfileEditClient
      userId={user.id}
      profile={profileData as any}
      demographics={demographicsData as any}
    />
  )
}
