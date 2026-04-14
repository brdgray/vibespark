import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const isProtected = url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/onboarding')

  if (!user && isProtected) {
    url.pathname = '/auth/signin'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Check if user is suspended (skip on /suspended page and API routes)
  if (user && !url.pathname.startsWith('/suspended') && !url.pathname.startsWith('/api')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_suspended')
      .eq('id', user.id)
      .single()

    if ((profile as any)?.is_suspended) {
      url.pathname = '/suspended'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
