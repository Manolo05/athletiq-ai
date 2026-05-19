import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify coach-athlete relationship
  const { data: rel } = await supabase
    .from('coach_athletes')
    .select('id')
    .eq('coach_id', user.id)
    .eq('athlete_id', id)
    .eq('status', 'active')
    .single()

  if (!rel) return NextResponse.json({ error: 'Not your athlete' }, { status: 403 })

  // Get athlete profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  // Get recent workouts
  const { data: workouts } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', id)
    .order('started_at', { ascending: false })
    .limit(20)

  // Get health metrics
  const { data: health } = await supabase
    .from('health_metrics')
    .select('*')
    .eq('user_id', id)
    .order('date', { ascending: false })
    .limit(14)

  // Compute ACWR
  const now = new Date()
  const acute = workouts?.filter(w => {
    const d = new Date(w.started_at)
    return (now.getTime() - d.getTime()) / 86400000 <= 7
  }).reduce((sum, w) => sum + (w.tss || w.duration_seconds / 60), 0) || 0

  const chronic = workouts?.filter(w => {
    const d = new Date(w.started_at)
    return (now.getTime() - d.getTime()) / 86400000 <= 28
  }).reduce((sum, w) => sum + (w.tss || w.duration_seconds / 60), 0) || 0

  const acwr = chronic > 0 ? ((acute / 1) / (chronic / 4)).toFixed(2) : null

  // Flags
  const flags = []
  if (acwr && parseFloat(acwr) > 1.3) flags.push({ type: 'danger', message: `ACWR élevé: ${acwr} — risque de blessure` })
  if (acwr && parseFloat(acwr) < 0.8) flags.push({ type: 'warning', message: `ACWR bas: ${acwr} — charge insuffisante` })

  const latestHRV = health?.[0]?.hrv_ms
  const prevHRV = health?.[6]?.hrv_ms
  if (latestHRV && prevHRV && latestHRV < prevHRV * 0.9) {
    flags.push({ type: 'warning', message: `HRV en baisse: ${latestHRV}ms vs ${prevHRV}ms il y a 7j` })
  }

  return NextResponse.json({ profile, workouts, health, acwr, flags })
}
