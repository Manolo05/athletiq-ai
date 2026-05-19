import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { refreshStravaToken } from '@/lib/strava'

// Strava webhook verification (GET)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    return NextResponse.json({ 'hub.challenge': challenge })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Strava webhook events (POST)
export async function POST(req: NextRequest) {
  const event = await req.json()

  // Only handle activity creation/updates
  if (event.object_type !== 'activity') {
    return NextResponse.json({ ok: true })
  }

  if (event.aspect_type !== 'create' && event.aspect_type !== 'update') {
    return NextResponse.json({ ok: true })
  }

  const stravaAthleteId = String(event.owner_id)
  const activityId = String(event.object_id)

  const supabase = await createClient()

  // Find user by Strava athlete ID
  const { data: integration } = await supabase
    .from('integrations')
    .select('user_id')
    .eq('provider', 'strava')
    .eq('provider_user_id', stravaAthleteId)
    .single()

  if (!integration) {
    return NextResponse.json({ ok: true })
  }

  const userId = integration.user_id

  // Refresh token and fetch the activity
  const accessToken = await refreshStravaToken(userId)
  if (!accessToken) {
    return NextResponse.json({ ok: true })
  }

  const activityResponse = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!activityResponse.ok) {
    return NextResponse.json({ ok: true })
  }

  const activity = await activityResponse.json()

  // Map sport type
  const sportMap: Record<string, string> = {
    Run: 'running', Ride: 'cycling', Swim: 'swimming',
    Walk: 'walking', Hike: 'hiking', TrailRun: 'trail_running',
    VirtualRide: 'cycling', VirtualRun: 'running',
    WeightTraining: 'strength', Yoga: 'yoga',
  }

  // Upsert the activity
  await supabase.from('workouts').upsert({
    user_id: userId,
    source: 'strava',
    source_id: activityId,
    sport_type: sportMap[activity.type] || 'other',
    title: activity.name,
    description: activity.description || null,
    started_at: activity.start_date,
    duration_seconds: activity.elapsed_time,
    distance_meters: activity.distance,
    elevation_gain_meters: activity.total_elevation_gain,
    calories: activity.calories || null,
    avg_hr: activity.average_heartrate || null,
    max_hr: activity.max_heartrate || null,
    avg_pace_seconds: activity.distance > 0
      ? Math.round(activity.moving_time / (activity.distance / 1000))
      : null,
    avg_power: activity.average_watts || null,
    perceived_effort: activity.perceived_exertion || null,
    notes: activity.description || null,
  }, { onConflict: 'user_id,source,source_id' })

  // Update last sync
  await supabase
    .from('integrations')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('provider', 'strava')

  return NextResponse.json({ ok: true })
}
