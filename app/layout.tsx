import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'VibeSpark — Verified AI Startup Directory',
    template: '%s | VibeSpark',
  },
  description: 'Discover verified AI-built startups gaining real traction. Vote, research, and connect with the community.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-icon.svg', type: 'image/svg+xml' }],
    shortcut: ['/icon.svg'],
  },
  openGraph: {
    siteName: 'VibeSpark',
    type: 'website',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  let role: string | null = null

  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = profileData

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .limit(10)

    if (roleData && roleData.length > 0) {
      // Prioritize admin > startup_owner > user for primary role display
      const roles = (roleData as any[]).map((r: any) => r.role)
      role = roles.includes('admin') ? 'admin' : roles.includes('startup_owner') ? 'startup_owner' : 'user'
    }
  }

  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-white antialiased`}>
        <GoogleAnalytics />
        <Navbar user={user} profile={profile} role={role} />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <Toaster richColors />
      </body>
    </html>
  )
}
