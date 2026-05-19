import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

// GET: list coach's athletes
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: athletes } = await supabase
    .from('coach_athletes')
    .select(`
      id, status, created_at, invite_code,
      athlete:profiles!coach_athletes_athlete_id_fkey (
        id, full_name, email, avatar_url, sport_primary, level
      )
    `)
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ athletes: athletes || [] })
}

// POST: create invite link for a new athlete
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, athleteId, inviteCode } = await req.json()

  if (action === 'invite') {
    // Generate unique invite code
    const code = randomBytes(6).toString('hex')
    // Create pending relationship (athlete_id will be set when they accept)
    const { data, error } = await supabase
      .from('coach_athletes')
      .insert({
        coach_id: user.id,
        athlete_id: user.id, // placeholder, updated on accept
        status: 'pending',
        invite_code: code,
      })
      .select('invite_code')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const inviteUrl = `${process.env.NEXT_PUBLIC_URL}/join/${data.invite_code}`
    return NextResponse.json({ inviteCode: data.invite_code, inviteUrl })
  }

  if (action === 'accept' && inviteCode) {
    // Athlete accepts invite
    const { error } = await supabase
      .from('coach_athletes')
      .update({ athlete_id: user.id, status: 'active' })
      .eq('invite_code', inviteCode)
      .eq('status', 'pending')

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  }

  if (action === 'remove' && athleteId) {
    await supabase
      .from('coach_athletes')
      .delete()
      .eq('coach_id', user.id)
      .eq('athlete_id', athleteId)

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
