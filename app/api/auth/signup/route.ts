import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { demographicsSchema } from '@/lib/validations/auth'

type DemographicsBody = {
  ageRange: string
  country: string
  profession: string
  industry: string
  personaType: string
  technicalLevel?: string
}

export async function POST(request: Request) {
  const body = await request.json()
  const { email, password, displayName, username, demographics } = body as {
    email?: string
    password?: string
    displayName?: string
    username?: string
    demographics?: DemographicsBody
  }

  if (!email || !password || !displayName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!username || !/^[a-z0-9_]{3,20}$/.test(username)) {
    return NextResponse.json(
      { error: 'Username is required (3–20 lowercase letters, numbers, or underscores)' },
      { status: 400 },
    )
  }

  if (demographics) {
    const parsed = demographicsSchema.safeParse({
      ageRange: demographics.ageRange,
      country: demographics.country?.trim(),
      profession: demographics.profession,
      industry: demographics.industry,
      personaType: demographics.personaType,
      technicalLevel: demographics.technicalLevel || undefined,
    })
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid demographics' },
        { status: 400 },
      )
    }
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { data: existingUsers } = await adminClient.auth.admin.listUsers()
  const alreadyExists = existingUsers?.users?.some(u => u.email === email)
  if (alreadyExists) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 })
  }

  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()
  if (existingProfile) {
    return NextResponse.json({ error: 'That username is already taken.' }, { status: 400 })
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
    await adminClient
      .from('profiles')
      .update({
        display_name: displayName,
        username,
      } as any)
      .eq('id', data.user.id)

    await adminClient
      .from('user_roles')
      .upsert({ user_id: data.user.id, role: 'user' } as any, {
        onConflict: 'user_id,role',
      })

    await adminClient
      .from('user_score_events' as any)
      .insert({ user_id: data.user.id, event_type: 'signup_bonus', points: 10 })

    if (demographics) {
      const d = demographicsSchema.parse({
        ageRange: demographics.ageRange,
        country: demographics.country.trim(),
        profession: demographics.profession,
        industry: demographics.industry,
        personaType: demographics.personaType,
        technicalLevel: demographics.technicalLevel || undefined,
      })
      await adminClient.from('research_demographics').upsert(
        {
          user_id: data.user.id,
          age_range: d.ageRange,
          gender: null,
          country: d.country,
          profession: d.profession,
          industry: d.industry,
          persona_type: d.personaType,
          technical_level: d.technicalLevel || null,
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: 'user_id' },
      )
      await adminClient
        .from('profiles')
        .update({ is_research_participant: true } as any)
        .eq('id', data.user.id)
    }
  }

  return NextResponse.json({ success: true })
}
