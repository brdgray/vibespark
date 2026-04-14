import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminUsersClient from './AdminUsersClient'

export const metadata = { title: 'Admin — Users' }

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*, user_roles(role)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <p className="text-muted-foreground mt-0.5">Manage community members and roles</p>
      </div>
      <AdminUsersClient users={profiles ?? []} />
    </div>
  )
}
