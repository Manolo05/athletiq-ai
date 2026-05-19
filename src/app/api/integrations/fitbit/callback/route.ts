import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(new URL('/settings?error=fitbit_denied', process.env.NEXT_PUBLIC_URL!))
  }

  try {
    const basicAuth = Buffer.from(`${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`).toString('base64')

    const tokenResponse = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_URL}/api/integrations/fitbit/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL('/settings?error=fitbit_token', process.env.NEXT_PUBLIC_URL!))
    }

    const tokens = await tokenResponse.json()
    const supabase = await createClient()

    await supabase.from('integrations').upsert({
      user_id: state,
      provider: 'fitbit',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      provider_user_id: tokens.user_id,
      scopes: ['activity', 'heartrate', 'sleep', 'profile', 'weight'],
      last_sync_at: new Date().toISOString(),
      sync_enabled: true,
    }, { onConflict: 'user_id,provider' })

    return NextResponse.redirect(new URL('/settings?success=fitbit', process.env.NEXT_PUBLIC_URL!))
  } catch (err) {
    console.error('Fitbit callback error:', err)
    return NextResponse.redirect(new URL('/settings?error=fitbit_unknown', process.env.NEXT_PUBLIC_URL!))
  }
}
