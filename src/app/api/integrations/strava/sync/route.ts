import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { refreshStravaToken, fetchStravaActivities } from '@/lib/strava'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const accessToken = await refreshStravaToken(user.id)
  if (!accessToken) {
    return NextResponse.json({ error: 'Strava not connected' }, { status: 400 })
  }

  // Get last sync timestamp
  const { data: integration } = await supabase
    .from('integrations')
    .select('last_sync_at')
    .eq('user_id', user.id)
    .eq('provider', 'strava')
    .single()

  const after = integration?.last_sync_at
    ? Math.floor(new Date(integration.last_sync_at).getTime() / 1000)
    : undefined

  const activities = await fetchStravaActivities(accessToken, after)

  let synced = 0
  for (const activity of activities) {
    const { error } = await supabase.from('workouts').upsert({
      user_id: user.id,
      source: 'strava',
      source_id: String(activity.id),
      sport_type: mapStravaType(activity.type),
      title: activity.name,
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
    }, { onConflict: 'user_id,source,source_id' })

    if (!error) synced++
  }

  // Update last sync
  await supabase
    .from('integrations')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('provider', 'strava')

  return NextResponse.json({ synced, total: activities.length })
}

function mapStravaType(type: string): string {
  const map: Record<string, string> = {
    Run: 'running', Ride: 'cycling', Swim: 'swimming',
    Walk: 'walking', Hike: 'hiking', AlpineSki: 'skiing',
    CrossCountrySkiing: 'skiing', WeightTraining: 'strength',
    Yoga: 'yoga', Workout: 'other', TrailRun: 'trail_running',
    VirtualRide: 'cycling', VirtualRun: 'running',
  }
  return map[type] || 'other'
}
