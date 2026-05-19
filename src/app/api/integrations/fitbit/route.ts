import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_URL))
  }

  const clientId = process.env.FITBIT_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Fitbit not configured. Add FITBIT_CLIENT_ID and FITBIT_CLIENT_SECRET to your environment variables.' }, { status: 500 })
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_URL}/api/integrations/fitbit/callback`
  const scope = 'activity heartrate sleep profile weight'
  const state = user.id

  const fitbitAuthUrl = `https://www.fitbit.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`

  return NextResponse.redirect(fitbitAuthUrl)
}
