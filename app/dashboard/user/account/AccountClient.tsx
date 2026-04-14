'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AccountClientProps {
  userId: string
  email: string
  roles: string[]
  isOAuthUser: boolean
}

const ROLE_CONFIG: Record<string, { label: string; desc: string; color: string }> = {
  user:          { label: '👤 Community Member', desc: 'Explore startups, vote, save, and give research feedback.',    color: 'bg-slate-100 text-slate-700 border-slate-200' },
  startup_owner: { label: '🚀 Startup Founder',  desc: 'Submit startups, access the Research Lab, track traction.',   color: 'bg-orange-100 text-orange-700 border-orange-200' },
  admin:         { label: '🛡 Admin',             desc: 'Full platform access: moderation, verification, analytics.',  color: 'bg-purple-100 text-purple-700 border-purple-200' },
}

export default function AccountClient({ userId: _userId, email, roles, isOAuthUser }: AccountClientProps) {
  const supabase = createClient()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPw, setChangingPw] = useState(false)

  async function changePassword() {
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }

    setChangingPw(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setChangingPw(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your login credentials and see your roles</p>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-2xl border p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Account Info</h2>
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 border p-4">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Email address</p>
            <p className="font-medium text-slate-900 mt-0.5">{email}</p>
          </div>
        </div>
      </div>

      {/* Roles */}
      <div className="bg-white rounded-2xl border p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-900">Your Roles</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Your account can have multiple roles simultaneously.</p>
        </div>
        <div className="space-y-3">
          {roles.map(role => {
            const cfg = ROLE_CONFIG[role] ?? { label: role, desc: '', color: 'bg-slate-100 text-slate-700 border-slate-200' }
            return (
              <div key={role} className={cn('flex items-start gap-3 rounded-2xl border p-4', cfg.color)}>
                <div>
                  <p className="font-semibold text-sm">{cfg.label}</p>
                  <p className="text-xs mt-0.5 opacity-80">{cfg.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
        {!roles.includes('startup_owner') && (
          <p className="text-xs text-muted-foreground">
            The <strong>Startup Founder</strong> role is added automatically when you submit a startup.
          </p>
        )}
      </div>

      {/* Password change */}
      {!isOAuthUser ? (
        <div className="bg-white rounded-2xl border p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-slate-900">Change Password</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Leave blank to keep your current password.</p>
          </div>
          <div className="space-y-3 max-w-sm">
            <div className="space-y-1.5">
              <Label>Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>
            <Button
              onClick={changePassword}
              disabled={changingPw || !newPassword}
              className="bg-slate-800 hover:bg-slate-900 text-white"
            >
              {changingPw ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="font-semibold text-slate-900 mb-2">Sign-in Method</h2>
          <p className="text-sm text-muted-foreground">
            You signed in with Google. Password management is handled through your Google account.
          </p>
        </div>
      )}
    </div>
  )
}
