'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Search, Shield, ShieldOff, UserX, UserCheck } from 'lucide-react'

interface AdminUsersClientProps {
  users: any[]
}

export default function AdminUsersClient({ users }: AdminUsersClientProps) {
  const [search, setSearch] = useState('')
  const [localUsers, setLocalUsers] = useState(users)
  const [loading, setLoading] = useState<string | null>(null)

  const filtered = localUsers.filter(u =>
    !search ||
    u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.id?.toLowerCase().includes(search.toLowerCase())
  )

  async function toggleSuspend(userId: string, currentlySuspended: boolean) {
    setLoading(userId)
    const res = await fetch('/api/admin/suspend-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, suspend: !currentlySuspended }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error ?? 'Failed to update user')
    } else {
      toast.success(currentlySuspended ? 'User unsuspended' : 'User suspended')
      setLocalUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, is_suspended: !currentlySuspended } : u
      ))
    }
    setLoading(null)
  }

  const roleLabel = (roles: any[]) => {
    if (!roles?.length) return 'user'
    const r = roles.map((r: any) => r.role)
    if (r.includes('admin')) return 'admin'
    if (r.includes('startup_owner')) return 'founder'
    return 'user'
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="divide-y">
          {filtered.map((u: any) => {
            const role = roleLabel(u.user_roles)
            const suspended = u.is_suspended ?? false
            return (
              <div key={u.id} className={`flex items-center justify-between px-5 py-4 ${suspended ? 'bg-red-50/30' : 'hover:bg-slate-50'} transition-colors`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-600 flex-shrink-0">
                    {u.display_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-slate-900">{u.display_name ?? 'No name'}</div>
                    <div className="text-xs text-muted-foreground font-mono">{u.id.slice(0, 12)}…</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Link href={`/dashboard/admin/users/${u.id}`} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                    View activity
                  </Link>
                  {u.is_research_participant && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Research</Badge>
                  )}
                  <Badge className={
                    role === 'admin'   ? 'bg-purple-100 text-purple-700 border-purple-200' :
                    role === 'founder' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                  }>
                    {role}
                  </Badge>
                  {suspended && (
                    <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Suspended</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={suspended ? 'text-green-600 hover:text-green-700' : 'text-red-500 hover:text-red-600'}
                    disabled={loading === u.id}
                    onClick={() => toggleSuspend(u.id, suspended)}
                  >
                    {loading === u.id ? '…' : suspended
                      ? <><UserCheck className="h-3.5 w-3.5 mr-1" /> Unsuspend</>
                      : <><UserX className="h-3.5 w-3.5 mr-1" /> Suspend</>
                    }
                  </Button>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No users found</div>
          )}
        </div>
      </div>
    </div>
  )
}
