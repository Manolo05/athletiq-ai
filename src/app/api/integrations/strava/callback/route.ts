import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') // user ID
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(new URL('/settings?error=strava_denied', process.env.NEXT_PUBLIC_URL!))
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL('/settings?error=strava_token', process.env.NEXT_PUBLIC_URL!))
    }

    const tokens = await tokenResponse.json()

    // Save integration to Supabase
    const supabase = await createClient()
    
    const { error: dbError } = await supabase
      .from('integrations')
      .upsert({
        user_id: state,
        provider: 'strava',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(tokens.expires_at * 1000).toISOString(),
        provider_user_id: String(tokens.athlete.id),
        scopes: ['read', 'activity:read_all', 'profile:read_all'],
        last_sync_at: new Date().toISOString(),
        sync_enabled: true,
      }, { onConflict: 'user_id,provider' })

    if (dbError) {
      console.error('Supabase error:', dbError)
      return NextResponse.redirect(new URL('/settings?error=strava_save', process.env.NEXT_PUBLIC_URL!))
    }

    return NextResponse.redirect(new URL('/settings?success=strava', process.env.NEXT_PUBLIC_URL!))
  } catch (err) {
    console.error('Strava callback error:', err)
    return NextResponse.redirect(new URL('/settings?error=strava_unknown', process.env.NEXT_PUBLIC_URL!))
  }
}
