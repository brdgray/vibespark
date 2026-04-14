import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AccountClient from './AccountClient'

export const metadata = { title: 'Account Settings' }

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: rolesData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const roles = (rolesData as any[])?.map((r: any) => r.role) ?? ['user']
  const isOAuthUser = !user.email?.includes('@') || !!(user.app_metadata?.provider && user.app_metadata.provider !== 'email')

  return (
    <AccountClient
      userId={user.id}
      email={user.email ?? ''}
      roles={roles}
      isOAuthUser={isOAuthUser}
    />
  )
}
