import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(new URL('/settings?error=polar_denied', process.env.NEXT_PUBLIC_URL!))
  }

  try {
    const basicAuth = Buffer.from(`${process.env.POLAR_CLIENT_ID}:${process.env.POLAR_CLIENT_SECRET}`).toString('base64')

    const tokenResponse = await fetch('https://polarremote.com/v2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_URL}/api/integrations/polar/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL('/settings?error=polar_token', process.env.NEXT_PUBLIC_URL!))
    }

    const tokens = await tokenResponse.json()
    const supabase = await createClient()

    // Register user with Polar Accesslink
    await fetch('https://www.polaraccesslink.com/v3/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.access_token}`,
      },
      body: JSON.stringify({ 'member-id': state }),
    })

    await supabase.from('integrations').upsert({
      user_id: state,
      provider: 'polar',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      token_expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      provider_user_id: String(tokens.x_user_id || ''),
      scopes: ['accesslink'],
      last_sync_at: new Date().toISOString(),
      sync_enabled: true,
    }, { onConflict: 'user_id,provider' })

    return NextResponse.redirect(new URL('/settings?success=polar', process.env.NEXT_PUBLIC_URL!))
  } catch (err) {
    console.error('Polar callback error:', err)
    return NextResponse.redirect(new URL('/settings?error=polar_unknown', process.env.NEXT_PUBLIC_URL!))
  }
}
