import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Ensure profile exists (Google OAuth users bypass the trigger on first sign-in sometimes)
        const admin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // Upsert profile
        await admin.from('profiles').upsert({
          id: user.id,
          email: user.email,
          display_name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'User',
          avatar_url: user.user_metadata?.avatar_url ?? null,
        } as any, { onConflict: 'id' })

        // Ensure user role exists
        await admin.from('user_roles').upsert(
          { user_id: user.id, role: 'user' } as any,
          { onConflict: 'user_id,role' }
        )

        // New user (no display_name set by themselves yet) → onboarding
        // Returning user → wherever they were going
        const { data: profile } = await admin
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single()

        const isNewUser = !profile?.display_name ||
          profile.display_name === user.email?.split('@')[0]

        if (isNewUser && next === '/onboarding') {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/signin?error=auth_callback_failed`)
}
