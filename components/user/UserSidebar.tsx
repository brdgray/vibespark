'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Bookmark, ArrowUp, FlaskConical,
  Rocket, UserCircle, Settings, Zap,
} from 'lucide-react'

interface UserSidebarProps {
  profile: any
  roles: string[]
  totalScore: number
  badgeKeys: string[]
}

const NAV_ITEMS = [
  { href: '/dashboard/user',           label: 'Overview',         icon: LayoutDashboard, exact: true },
  { href: '/dashboard/user/saved',     label: 'Saved Startups',   icon: Bookmark },
  { href: '/dashboard/user/voted',     label: 'Voted',            icon: ArrowUp },
  { href: '/dashboard/user/research',  label: 'Research Given',   icon: FlaskConical },
]

const SETTINGS_ITEMS = [
  { href: '/dashboard/user/profile',  label: 'Edit Profile',     icon: UserCircle },
  { href: '/dashboard/user/account',  label: 'Account',          icon: Settings },
]

export default function UserSidebar({ profile, roles, totalScore, badgeKeys }: UserSidebarProps) {
  const pathname = usePathname()
  const handle = profile?.username ? `@${profile.username}` : '@member'
  const initials = (profile?.username || profile?.display_name)
    ? (profile.username || profile.display_name).split(/[\s_]/).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'VS'
  const isStartupOwner = roles.includes('startup_owner')

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-64 shrink-0 flex flex-col gap-6">
      {/* Profile card */}
      <div className="bg-white rounded-2xl border p-5 flex flex-col items-center text-center gap-3">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback className="bg-orange-100 text-orange-700 text-lg font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 w-full">
          <p className="font-semibold text-slate-900 truncate">{handle}</p>
          {!profile?.username && (
            <p className="text-xs text-amber-500 truncate">Set your @handle in Edit Profile</p>
          )}
        </div>

        {/* Score */}
        <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-full px-3 py-1">
          <Zap className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
          <span className="text-sm font-bold text-orange-600">{totalScore.toLocaleString()}</span>
          <span className="text-xs text-orange-400">pts</span>
        </div>

        {/* Role badges */}
        <div className="flex flex-wrap gap-1 justify-center">
          {roles.map(r => (
            <span key={r} className={cn(
              'text-[10px] font-medium rounded-full px-2 py-0.5 border',
              r === 'admin'         ? 'bg-purple-100 text-purple-700 border-purple-200' :
              r === 'startup_owner' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                     'bg-slate-100 text-slate-600 border-slate-200'
            )}>
              {r === 'admin' ? '🛡 Admin' : r === 'startup_owner' ? '🚀 Founder' : '👤 Member'}
            </span>
          ))}
        </div>

        {/* Badge count teaser */}
        {badgeKeys.length > 0 && (
          <p className="text-xs text-muted-foreground">
            🏅 {badgeKeys.length} badge{badgeKeys.length !== 1 ? 's' : ''} earned
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="bg-white rounded-2xl border overflow-hidden">
        <div className="px-3 py-2 border-b">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2">Activity</p>
        </div>
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors',
              isActive(item.href, item.exact)
                ? 'bg-orange-50 text-orange-600 border-r-2 border-orange-500'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}

        {isStartupOwner && (
          <Link
            href="/dashboard/startup"
            className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Rocket className="h-4 w-4 shrink-0" />
            My Startups
          </Link>
        )}

        <div className="px-3 py-2 border-t border-b mt-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2">Settings</p>
        </div>
        {SETTINGS_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors',
              isActive(item.href)
                ? 'bg-orange-50 text-orange-600 border-r-2 border-orange-500'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
