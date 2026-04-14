'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Zap } from 'lucide-react'
import type { ProfileRow } from '@/lib/supabase/types'

interface NavbarProps {
  user: { id: string; email?: string } | null
  profile: ProfileRow | null
  role: string | null
}

const navLinks = [
  { href: '/directory', label: 'Directory' },
  { href: '/trending', label: 'Trending' },
  { href: '/research-lab', label: 'Research Lab' },
]

export default function Navbar({ user, profile, role }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const profileAny = profile as any
  const handle = profileAny?.username ? `@${profileAny.username}` : '@member'
  const initials = (profileAny?.username || profileAny?.display_name)
    ? (profileAny.username || profileAny.display_name).split(/[\s_]/).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'VS'

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="VibeSpark" width={220} height={60} className="h-14 w-auto" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
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
              <LinkButton href="/auth/signin" variant="ghost" size="sm">
                Sign In
              </LinkButton>
              <LinkButton href="/submit" size="sm" className="bg-orange-500 hover:bg-orange-600">
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                Submit Startup
              </LinkButton>
            </>
          ) : (
            <>
              <LinkButton href="/submit" size="sm" className="bg-orange-500 hover:bg-orange-600">
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                Submit
              </LinkButton>
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full ring-2 ring-transparent hover:ring-orange-300 transition-all outline-none">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-orange-100 text-orange-700 text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-2 py-1.5 truncate">
                    <p className="text-sm font-semibold text-slate-800 truncate">{handle}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.location.href = '/dashboard/user'}>
                    My Dashboard
                  </DropdownMenuItem>
                  {role === 'startup_owner' && (
                    <DropdownMenuItem onClick={() => window.location.href = '/dashboard/startup'}>
                      Startup Dashboard
                    </DropdownMenuItem>
                  )}
                  {role === 'admin' && (
                    <DropdownMenuItem onClick={() => window.location.href = '/dashboard/admin'}>
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="flex flex-col gap-4 mt-6">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-base font-medium text-slate-700 hover:text-orange-500"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t space-y-2">
                {!user ? (
                  <>
                    <LinkButton href="/auth/signin" variant="outline" className="w-full">
                      Sign In
                    </LinkButton>
                    <LinkButton href="/submit" className="w-full bg-orange-500 hover:bg-orange-600">
                      Submit Startup
                    </LinkButton>
                  </>
                ) : (
                  <>
                    <LinkButton href="/dashboard/user" variant="outline" className="w-full">
                      My Dashboard
                    </LinkButton>
                    <LinkButton href="/submit" className="w-full bg-orange-500 hover:bg-orange-600">
                      Submit Startup
                    </LinkButton>
                    <Button variant="ghost" className="w-full text-destructive" onClick={handleSignOut}>Sign Out</Button>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
