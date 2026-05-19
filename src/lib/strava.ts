import { createClient } from '@/lib/supabase/server'

export async function refreshStravaToken(userId: string) {
  const supabase = await createClient()

  const { data: integration } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'strava')
    .single()

  if (!integration) return null

  // Check if token is expired
  const expiresAt = new Date(integration.token_expires_at)
  if (expiresAt > new Date()) {
    return integration.access_token
  }

  // Refresh the token
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: integration.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) return null

  const tokens = await response.json()

  await supabase
    .from('integrations')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(tokens.expires_at * 1000).toISOString(),
    })
    .eq('user_id', userId)
    .eq('provider', 'strava')

  return tokens.access_token
}

export async function fetchStravaActivities(accessToken: string, after?: number) {
  const params = new URLSearchParams({ per_page: '50' })
  if (after) params.set('after', String(after))

  const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) return []
  return response.json()
}

export async function fetchStravaAthlete(accessToken: string) {
  const response = await fetch('https://www.strava.com/api/v3/athlete', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) return null
  return response.json()
}
