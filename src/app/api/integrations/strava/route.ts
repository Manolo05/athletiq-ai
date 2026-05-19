import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_URL))
  }

  const clientId = process.env.STRAVA_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Strava not configured' }, { status: 500 })
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_URL}/api/integrations/strava/callback`
  const scope = 'read,activity:read_all,profile:read_all'
  const state = user.id // pass user ID as state for the callback

  const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&approval_prompt=auto`

  return NextResponse.redirect(stravaAuthUrl)
}
