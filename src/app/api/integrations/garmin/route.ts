import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_URL))
  }

  const clientId = process.env.GARMIN_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Garmin not configured. Add GARMIN_CLIENT_ID and GARMIN_CLIENT_SECRET to your environment variables.' }, { status: 500 })
  }

  // Garmin uses OAuth 1.0a — requires a request token first
  // For simplicity, we use Garmin Connect API with OAuth 2.0 (newer API)
  const redirectUri = `${process.env.NEXT_PUBLIC_URL}/api/integrations/garmin/callback`
  const scope = 'activity:read health:read sleep:read'
  const state = user.id

  const garminAuthUrl = `https://connect.garmin.com/oauthConfirm?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`

  return NextResponse.redirect(garminAuthUrl)
}
