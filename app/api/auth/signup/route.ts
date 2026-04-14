import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password, displayName, username } = await request.json()

  if (!email || !password || !displayName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (username && !/^[a-z0-9_]{3,20}$/.test(username)) {
    return NextResponse.json({ error: 'Invalid username format' }, { status: 400 })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Check if email already exists
  const { data: existingUsers } = await adminClient.auth.admin.listUsers()
  const alreadyExists = existingUsers?.users?.some(u => u.email === email)
  if (alreadyExists) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 })
  }

  // Check username uniqueness if provided
  if (username) {
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle()
    if (existingProfile) {
      return NextResponse.json({ error: 'That username is already taken.' }, { status: 400 })
    }
  }

  const { data, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: displayName },
  })

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 })
  }

  if (data?.user?.id) {
    // Save display name and optional username
    await adminClient
      .from('profiles')
      .update({
        display_name: displayName,
        ...(username ? { username } : {}),
      } as any)
      .eq('id', data.user.id)

    // Always assign the 'user' role (startup_owner is added when they submit a startup)
    await adminClient
      .from('user_roles')
      .upsert({ user_id: data.user.id, role: 'user' } as any, {
        onConflict: 'user_id,role',
      })

    // Award signup bonus points
    await adminClient
      .from('user_score_events' as any)
      .insert({ user_id: data.user.id, event_type: 'signup_bonus', points: 10 })
  }

  return NextResponse.json({ success: true })
}
