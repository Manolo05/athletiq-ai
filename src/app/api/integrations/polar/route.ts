import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_URL))
  }

  const clientId = process.env.POLAR_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Polar not configured. Add POLAR_CLIENT_ID and POLAR_CLIENT_SECRET to your environment variables.' }, { status: 500 })
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_URL}/api/integrations/polar/callback`
  const state = user.id

  const polarAuthUrl = `https://flow.polar.com/oauth2/authorization?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`

  return NextResponse.redirect(polarAuthUrl)
}
