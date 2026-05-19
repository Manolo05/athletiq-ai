import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sport, goal, weeks, sessionsPerWeek, level } = await req.json()
  const numWeeks = parseInt(weeks)
  const numSessions = parseInt(sessionsPerWeek)

  // Get user profile for personalization
  const { data: profile } = await supabase.from('profiles').select('hr_max, hr_rest, vo2_max, vma, ftp').eq('id', user.id).single()

  if (process.env.OPENAI_API_KEY) {
    // Use OpenAI for plan generation
    const prompt = `Génère un plan d'entraînement ${sport} pour un objectif ${goal}, niveau ${level}, ${numWeeks} semaines, ${numSessions} séances par semaine.
${profile?.vma ? `VMA: ${profile.vma} km/h` : ''}
${profile?.ftp ? `FTP: ${profile.ftp}W` : ''}
${profile?.hr_max ? `FC max: ${profile.hr_max}` : ''}

Réponds UNIQUEMENT en JSON valide avec ce format exact:
{"title":"...","weeks":[{"week":1,"sessions":[{"day":"Lundi","type":"...","description":"...","duration":"45min","intensity":"easy|moderate|hard|rest"}]}]}`

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 3000,
          temperature: 0.7,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const content = data.choices[0].message.content
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const plan = JSON.parse(jsonMatch[0])
          // Save to DB
          await supabase.from('training_plans').insert({
            user_id: user.id, title: plan.title, sport, objective: goal,
            level, frequency_per_week: numSessions, duration_weeks: numWeeks,
            start_date: new Date().toISOString().split('T')[0],
            plan_data: plan, ai_generated: true,
          })
          return NextResponse.json({ plan })
        }
      }
    } catch (err) {
      console.error('OpenAI plan error:', err)
    }
  }

  // Fallback: generate a structured plan algorithmically
  const plan = generateFallbackPlan(sport, goal, numWeeks, numSessions, level, profile)

  await supabase.from('training_plans').insert({
    user_id: user.id, title: plan.title, sport, objective: goal,
    level, frequency_per_week: numSessions, duration_weeks: numWeeks,
    start_date: new Date().toISOString().split('T')[0],
    plan_data: plan, ai_generated: true,
  })

  return NextResponse.json({ plan })
}

function generateFallbackPlan(
  sport: string, goal: string, weeks: number, sessions: number, level: string,
  profile: Record<string, unknown> | null
) {
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
  const goalLabel = { '5km': '5 km', '10km': '10 km', semi: 'Semi-marathon', marathon: 'Marathon', ultra: 'Ultra-trail', fitness: 'Remise en forme' }[goal] || goal
  const sportLabel = { running: 'Course', cycling: 'Cyclisme', triathlon: 'Triathlon', trail: 'Trail', swimming: 'Natation' }[sport] || sport

  const sessionTypes: Record<string, { type: string; desc: string; intensity: string; duration: string }[]> = {
    running: [
      { type: 'Footing', desc: 'Course lente en zone 2, rythme conversationnel', intensity: 'easy', duration: '40min' },
      { type: 'Fractionné', desc: '10x400m à 95% VMA, récup 1min30', intensity: 'hard', duration: '50min' },
      { type: 'Tempo', desc: 'Course au seuil (zone 3-4) pendant 20min', intensity: 'moderate', duration: '45min' },
      { type: 'Sortie longue', desc: 'Course lente et longue, gestion énergie', intensity: 'easy', duration: '1h15' },
      { type: 'Côtes', desc: '8x200m en côte, récup descente', intensity: 'hard', duration: '45min' },
      { type: 'Récupération', desc: 'Footing très lent ou marche active', intensity: 'easy', duration: '30min' },
    ],
    cycling: [
      { type: 'Endurance', desc: 'Sortie Z2, cadence 85-95rpm', intensity: 'easy', duration: '1h30' },
      { type: 'Intervalles', desc: '5x5min à 105% FTP, récup 3min', intensity: 'hard', duration: '1h15' },
      { type: 'Sweet Spot', desc: '2x20min à 88-93% FTP', intensity: 'moderate', duration: '1h' },
      { type: 'Sortie longue', desc: 'Endurance Z2 avec quelques relances', intensity: 'easy', duration: '2h30' },
    ],
  }

  const templates = sessionTypes[sport] || sessionTypes.running
  const title = `Plan ${sportLabel} — ${goalLabel} (${weeks} sem.)`

  const weeksPlan = Array.from({ length: weeks }, (_, weekIdx) => {
    const isRecoveryWeek = (weekIdx + 1) % 4 === 0
    const progression = Math.min(1 + weekIdx * 0.05, 1.4)
    const isTaper = weekIdx >= weeks - 2

    const weekSessions = Array.from({ length: sessions }, (_, sIdx) => {
      const dayIdx = Math.round(sIdx * (7 / sessions))
      let template
      if (isRecoveryWeek || isTaper) {
        template = templates[0] // easy
      } else if (sIdx === 0) {
        template = templates[1] || templates[0] // hard
      } else if (sIdx === sessions - 1) {
        template = templates[3] || templates[0] // long
      } else {
        template = templates[sIdx % templates.length]
      }

      const baseDuration = parseInt(template.duration) || 40
      const adjustedDuration = isRecoveryWeek ? Math.round(baseDuration * 0.7) : isTaper ? Math.round(baseDuration * 0.6) : Math.round(baseDuration * progression)

      return {
        day: days[dayIdx],
        type: template.type,
        description: template.desc + (profile?.vma && sport === 'running' ? ` (VMA: ${profile.vma} km/h)` : ''),
        duration: `${adjustedDuration}min`,
        intensity: isRecoveryWeek ? 'easy' : template.intensity,
      }
    })

    return { week: weekIdx + 1, sessions: weekSessions }
  })

  return { title, weeks: weeksPlan }
}
