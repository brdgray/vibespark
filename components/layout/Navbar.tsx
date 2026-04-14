'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Menu, Zap, LayoutDashboard, Bookmark, ArrowUp,
  FlaskConical, Rocket, UserCircle, Settings, LogOut,
  TrendingUp, BookOpen, Home, Shield,
} from 'lucide-react'
import type { ProfileRow } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

interface NavbarProps {
  user: { id: string; email?: string } | null
  profile: ProfileRow | null
  role: string | null
}

const NAV_LINKS = [
  { href: '/',              label: 'Home',         icon: Home },
  { href: '/directory',     label: 'Directory',    icon: BookOpen },
  { href: '/trending',      label: 'Trending',     icon: TrendingUp },
  { href: '/research-lab',  label: 'Research Lab', icon: FlaskConical },
]

export default function Navbar({ user, profile, role }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    setMobileOpen(false)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function closeMobile() {
    setMobileOpen(false)
  }

  const profileAny = profile as any
  const handle = profileAny?.username ? `@${profileAny.username}` : '@member'
  const initials = (profileAny?.username || profileAny?.display_name)
    ? (profileAny.username || profileAny.display_name).split(/[\s_]/).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'VS'

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 sm:h-20 items-center justify-between px-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/logo.png" alt="VibeSpark" width={220} height={60} className="h-10 sm:h-14 w-auto" />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.filter(l => l.href !== '/').map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 hover:text-orange-500 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {role === 'admin' && (
            <Link href="/dashboard/admin" className="text-sm font-medium text-purple-600 hover:text-purple-700">
              Admin
            </Link>
          )}
        </div>

        {/* Desktop right actions */}
        <div className="hidden md:flex items-center gap-3">
          {!user ? (
            <>
              <LinkButton href="/auth/signin" variant="ghost" size="sm">Sign In</LinkButton>
              <LinkButton href="/submit" size="sm" className="bg-orange-500 hover:bg-orange-600">
                <Zap className="mr-1.5 h-3.5 w-3.5" /> Submit Startup
              </LinkButton>
            </>
          ) : (
            <>
              <LinkButton href="/submit" size="sm" className="bg-orange-500 hover:bg-orange-600">
                <Zap className="mr-1.5 h-3.5 w-3.5" /> Submit
              </LinkButton>
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full ring-2 ring-transparent hover:ring-orange-300 transition-all outline-none">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-orange-100 text-orange-700 text-xs font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-semibold text-slate-800 truncate">{handle}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.location.href = '/dashboard/user'}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> My Dashboard
                  </DropdownMenuItem>
                  {role === 'startup_owner' && (
                    <DropdownMenuItem onClick={() => window.location.href = '/dashboard/startup'}>
                      <Rocket className="mr-2 h-4 w-4" /> Startup Dashboard
                    </DropdownMenuItem>
                  )}
                  {role === 'admin' && (
                    <DropdownMenuItem onClick={() => window.location.href = '/dashboard/admin'}>
                      <Shield className="mr-2 h-4 w-4" /> Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger className="md:hidden inline-flex items-center justify-center rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <Menu className="h-5 w-5" />
          </SheetTrigger>

          <SheetContent side="right" className="w-[85vw] max-w-sm p-0 flex flex-col">

            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 py-4 border-b bg-white">
              <Link href="/" onClick={closeMobile}>
                <Image src="/logo.png" alt="VibeSpark" width={140} height={40} className="h-8 w-auto" />
              </Link>
            </div>

            {/* User profile section (logged in) */}
            {user && (
              <div className="px-5 py-4 border-b bg-slate-50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-orange-100 text-orange-700 font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{handle}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    href="/submit"
                    onClick={closeMobile}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2.5 transition-colors"
                  >
                    <Zap className="h-3.5 w-3.5" /> Submit Startup
                  </Link>
                </div>
              </div>
            )}

            {/* Scrollable nav */}
            <div className="flex-1 overflow-y-auto py-2">

              {/* Main navigation */}
              <div className="px-3 py-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">Explore</p>
                {NAV_LINKS.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobile}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-orange-500 transition-colors"
                  >
                    <link.icon className="h-4 w-4 shrink-0 text-slate-400" />
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* User section */}
              {user ? (
                <>
                  <div className="mx-3 my-1 border-t" />
                  <div className="px-3 py-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">My Account</p>
                    <Link
                      href="/dashboard/user"
                      onClick={closeMobile}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-orange-500 transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4 shrink-0 text-slate-400" />
                      My Dashboard
                    </Link>
                    <Link
                      href="/dashboard/user/saved"
                      onClick={closeMobile}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-orange-500 transition-colors"
                    >
                      <Bookmark className="h-4 w-4 shrink-0 text-slate-400" />
                      Saved Startups
                    </Link>
                    <Link
                      href="/dashboard/user/voted"
                      onClick={closeMobile}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-orange-500 transition-colors"
                    >
                      <ArrowUp className="h-4 w-4 shrink-0 text-slate-400" />
                      Voted
                    </Link>
                    <Link
                      href="/dashboard/user/research"
                      onClick={closeMobile}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-orange-500 transition-colors"
                    >
                      <FlaskConical className="h-4 w-4 shrink-0 text-slate-400" />
                      Research Given
                    </Link>
                    {role === 'startup_owner' && (
                      <Link
                        href="/dashboard/startup"
                        onClick={closeMobile}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-orange-500 transition-colors"
                      >
                        <Rocket className="h-4 w-4 shrink-0 text-slate-400" />
                        My Startups
                      </Link>
                    )}
                    {role === 'admin' && (
                      <Link
                        href="/dashboard/admin"
                        onClick={closeMobile}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors"
                      >
                        <Shield className="h-4 w-4 shrink-0" />
                        Admin Panel
                      </Link>
                    )}
                    <div className="mx-0 my-1 border-t" />
                    <Link
                      href="/dashboard/user/profile"
                      onClick={closeMobile}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-orange-500 transition-colors"
                    >
                      <UserCircle className="h-4 w-4 shrink-0 text-slate-400" />
                      Edit Profile
                    </Link>
                    <Link
                      href="/dashboard/user/account"
                      onClick={closeMobile}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-orange-500 transition-colors"
                    >
                      <Settings className="h-4 w-4 shrink-0 text-slate-400" />
                      Account Settings
                    </Link>
                  </div>
                </>
              ) : (
                <div className="mx-3 my-1 border-t" />
              )}
            </div>

            {/* Sheet footer */}
            <div className="border-t bg-white px-5 py-4">
              {user ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:bg-red-50 hover:text-destructive gap-3"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/auth/signin"
                    onClick={closeMobile}
                    className="flex items-center justify-center rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/submit"
                    onClick={closeMobile}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white py-2.5 text-sm font-semibold transition-colors"
                  >
                    <Zap className="h-3.5 w-3.5" /> Submit Startup
                  </Link>
                </div>
              )}
            </div>

          </SheetContent>
        </Sheet>

      </div>
    </nav>
  )
}
