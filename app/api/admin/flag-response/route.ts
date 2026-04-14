import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { responseId } = await request.json()
  if (!responseId) return NextResponse.json({ error: 'Missing responseId' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: roleRow } = await supabase
    .from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle()
  if (!roleRow) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await (supabase.from('research_responses') as any)
    .update({ is_flagged: true })
    .eq('id', responseId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
