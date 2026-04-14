import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Mail, Clock } from 'lucide-react'

export const metadata = { title: 'Admin — Contact Inbox' }

export default async function AdminContactPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: roleRow } = await supabase
    .from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle()
  if (!roleRow) redirect('/')

  const { data: submissions } = await (supabase.from('contact_submissions') as any)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  const items = submissions ?? []
  const newCount = items.filter((x: any) => x.status === 'new').length

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contact Inbox</h1>
          <p className="text-muted-foreground mt-0.5">Messages submitted from the site contact form</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-sm">
          <Clock className="h-4 w-4 text-orange-500" />
          <span className="font-medium">{newCount} new</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Mail className="mx-auto h-8 w-8 opacity-30 mb-2" />
            <p>No contact submissions yet.</p>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((row: any) => (
              <div key={row.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{row.subject}</p>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {row.name} · {row.email}
                      {row.company ? ` · ${row.company}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      row.status === 'new'
                        ? 'bg-orange-100 text-orange-700'
                        : row.status === 'resolved'
                          ? 'bg-green-100 text-green-700'
                          : row.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-700'
                    }`}>
                      {row.status}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(row.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-700 mt-3 whitespace-pre-wrap">{row.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
