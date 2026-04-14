'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Bookmark, ArrowUp, FlaskConical,
  Rocket, UserCircle, Settings, Zap,
} from 'lucide-react'

interface UserMobileNavProps {
  profile: any
  roles: string[]
  totalScore: number
  badgeKeys: string[]
}

const NAV_ITEMS = [
  { href: '/dashboard/user',           label: 'Overview',    icon: LayoutDashboard, exact: true },
  { href: '/dashboard/user/saved',     label: 'Saved',       icon: Bookmark },
  { href: '/dashboard/user/voted',     label: 'Voted',       icon: ArrowUp },
  { href: '/dashboard/user/research',  label: 'Research',    icon: FlaskConical },
  { href: '/dashboard/user/profile',   label: 'Profile',     icon: UserCircle },
  { href: '/dashboard/user/account',   label: 'Account',     icon: Settings },
]

export default function UserMobileNav({ profile, roles, totalScore, badgeKeys: _badgeKeys }: UserMobileNavProps) {
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
    <div className="bg-white border-b">
      {/* Profile strip */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-slate-50">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback className="bg-orange-100 text-orange-700 text-sm font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">{handle}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Zap className="h-3 w-3 text-orange-500 fill-orange-500" />
            <span className="text-xs font-bold text-orange-600">{totalScore.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">pts</span>
            {roles.map(r => (
              <span key={r} className={cn(
                'ml-1 text-[9px] font-semibold rounded-full px-1.5 py-0.5',
                r === 'admin'         ? 'bg-purple-100 text-purple-700' :
                r === 'startup_owner' ? 'bg-orange-100 text-orange-700' :
                                       'bg-slate-100 text-slate-600'
              )}>
                {r === 'admin' ? 'Admin' : r === 'startup_owner' ? 'Founder' : 'Member'}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable tab nav */}
      <div className="overflow-x-auto scrollbar-none">
        <div className="flex px-2 py-1 gap-1 min-w-max">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors',
                  active
                    ? 'bg-orange-100 text-orange-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                {item.label}
              </Link>
            )
          })}
          {isStartupOwner && (
            <Link
              href="/dashboard/startup"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Rocket className="h-3.5 w-3.5 shrink-0" />
              My Startups
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
