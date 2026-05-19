import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(new URL('/settings?error=garmin_denied', process.env.NEXT_PUBLIC_URL!))
  }

  try {
    const tokenResponse = await fetch('https://connectapi.garmin.com/oauth-service/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GARMIN_CLIENT_ID!,
        client_secret: process.env.GARMIN_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_URL}/api/integrations/garmin/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL('/settings?error=garmin_token', process.env.NEXT_PUBLIC_URL!))
    }

    const tokens = await tokenResponse.json()
    const supabase = await createClient()

    await supabase.from('integrations').upsert({
      user_id: state,
      provider: 'garmin',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      provider_user_id: tokens.userId || null,
      scopes: ['activity:read', 'health:read', 'sleep:read'],
      last_sync_at: new Date().toISOString(),
      sync_enabled: true,
    }, { onConflict: 'user_id,provider' })

    return NextResponse.redirect(new URL('/settings?success=garmin', process.env.NEXT_PUBLIC_URL!))
  } catch (err) {
    console.error('Garmin callback error:', err)
    return NextResponse.redirect(new URL('/settings?error=garmin_unknown', process.env.NEXT_PUBLIC_URL!))
  }
}
