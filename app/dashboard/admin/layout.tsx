import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutDashboard, Rocket, Users, Shield, Zap, ChevronRight,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard/admin',            label: 'Overview',    icon: LayoutDashboard },
  { href: '/dashboard/admin/startups',   label: 'Startups',    icon: Rocket },
  { href: '/dashboard/admin/users',      label: 'Users',       icon: Users },
  { href: '/dashboard/admin/moderation', label: 'Moderation',  icon: Shield },
  { href: '/dashboard/admin/promotions', label: 'Promotions',  icon: Zap },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (!roleRow) redirect('/')

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-slate-900 text-slate-300 flex flex-col sticky top-0 h-screen">
        <div className="p-5 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-dark.png" alt="VibeSpark" width={120} height={32} className="h-8 w-auto" />
          </Link>
          <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-purple-900/50 border border-purple-700 px-2.5 py-0.5 text-xs font-medium text-purple-300">
            <Shield className="h-3 w-3" /> Admin Panel
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors group"
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
              <ChevronRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
