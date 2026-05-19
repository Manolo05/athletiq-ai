import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { message, conversationId } = await req.json()

  // Get user profile for context
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get recent workouts
  const { data: workouts } = await supabase
    .from('workouts')
    .select('sport_type, title, started_at, duration_seconds, distance_meters, avg_hr, max_hr, avg_pace_seconds, perceived_effort, tss')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(10)

  // Get latest health metrics
  const { data: health } = await supabase
    .from('health_metrics')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(7)

  // Get or create conversation
  let convId = conversationId
  if (!convId) {
    const { data: conv } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title: message.substring(0, 50) })
      .select('id')
      .single()
    convId = conv?.id
  }

  // Save user message
  if (convId) {
    await supabase.from('messages').insert({
      conversation_id: convId,
      role: 'user',
      content: message,
    })
  }

  // Get conversation history
  const { data: history } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })
    .limit(20)

  const systemPrompt = buildSystemPrompt(profile, workouts, health)

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...(history || []).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ]

  // Check if OpenAI key is configured
  if (!process.env.OPENAI_API_KEY) {
    // Fallback: simulated response
    const fallback = generateFallbackResponse(message, profile, workouts)
    if (convId) {
      await supabase.from('messages').insert({
        conversation_id: convId,
        role: 'assistant',
        content: fallback,
      })
    }
    return Response.json({ response: fallback, conversationId: convId })
  }

  // Call OpenAI
  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      max_tokens: 800,
      temperature: 0.7,
    }),
  })

  if (!openaiResponse.ok) {
    return Response.json({ error: 'AI unavailable' }, { status: 500 })
  }

  const data = await openaiResponse.json()
  const aiMessage = data.choices[0].message.content

  // Save AI response
  if (convId) {
    await supabase.from('messages').insert({
      conversation_id: convId,
      role: 'assistant',
      content: aiMessage,
    })
  }

  return Response.json({ response: aiMessage, conversationId: convId })
}

function buildSystemPrompt(
  profile: Record<string, unknown> | null,
  workouts: Record<string, unknown>[] | null,
  health: Record<string, unknown>[] | null
): string {
  const sportInfo = profile ? `Sport principal: ${profile.sport_primary || 'non défini'}, Niveau: ${profile.level || 'intermédiaire'}` : ''
  const physioInfo = profile ? `FC max: ${profile.hr_max || '?'}, FC repos: ${profile.hr_rest || '?'}, VO2max: ${profile.vo2_max || '?'}, VMA: ${profile.vma || '?'}, FTP: ${profile.ftp || '?'}` : ''

  const workoutSummary = workouts?.length
    ? workouts.map((w: Record<string, unknown>) =>
        `- ${w.title || w.sport_type} le ${new Date(w.started_at as string).toLocaleDateString('fr')}: ${Math.round((w.duration_seconds as number || 0) / 60)}min, ${((w.distance_meters as number || 0) / 1000).toFixed(1)}km, FC moy ${w.avg_hr || '?'}bpm, RPE ${w.perceived_effort || '?'}/10`
      ).join('\n')
    : 'Aucune activité récente'

  const healthSummary = health?.length
    ? health.map((h: Record<string, unknown>) =>
        `- ${h.date}: HRV ${h.hrv_ms || '?'}ms, FC repos ${h.resting_hr || '?'}bpm, Sommeil ${h.sleep_duration_minutes ? Math.round((h.sleep_duration_minutes as number) / 60) + 'h' + ((h.sleep_duration_minutes as number) % 60) : '?'}, Steps ${h.steps || '?'}`
      ).join('\n')
    : 'Aucune donnée santé récente'

  return `Tu es le coach sportif IA d'AthletIQ, un expert en sciences du sport et en physiologie de l'exercice. Tu parles en français, de manière décontractée mais précise.

PROFIL ATHLÈTE:
${sportInfo}
${physioInfo}
Poids: ${profile?.weight_kg || '?'}kg, Taille: ${profile?.height_cm || '?'}cm

ACTIVITÉS RÉCENTES (10 dernières):
${workoutSummary}

MÉTRIQUES SANTÉ (7 derniers jours):
${healthSummary}

RÈGLES:
- Analyse les données disponibles pour donner des conseils personnalisés
- Utilise les zones FC (Karvonen), le TSS, le ratio charge aiguë/chronique (ACWR)
- Alerte si ACWR > 1.3, si HRV baisse > 10%, si FC repos augmente > 5%
- Recommande des séances adaptées au niveau et à l'état de récupération
- Sois motivant mais honnête sur les risques de surentraînement
- Réponds en français, utilise des emojis avec modération
- Sois concis (max 200 mots) sauf si l'utilisateur demande des détails`
}

function generateFallbackResponse(
  message: string,
  profile: Record<string, unknown> | null,
  workouts: Record<string, unknown>[] | null
): string {
  const name = profile?.full_name ? ` ${(profile.full_name as string).split(' ')[0]}` : ''
  const hasWorkouts = workouts && workouts.length > 0
  const msg = message.toLowerCase()

  if (msg.includes('bonjour') || msg.includes('salut') || msg.includes('hello')) {
    return `Salut${name} ! 👋 Je suis ton coach IA AthletIQ. ${hasWorkouts ? `Je vois que tu as ${workouts.length} activités récentes, c'est top !` : `Connecte Strava ou Garmin dans les réglages pour que je puisse analyser tes données.`} Comment je peux t'aider aujourd'hui ?`
  }

  if (msg.includes('plan') || msg.includes('programme') || msg.includes('entraînement')) {
    return `Pour te créer un plan optimal${name}, j'ai besoin de quelques infos :\n\n1. 🎯 Quel est ton objectif ? (ex: marathon, 10km, remise en forme)\n2. 📅 En combien de semaines ?\n3. ⏰ Combien de séances par semaine ?\n\n${hasWorkouts ? `D'après tes dernières activités, tu sembles avoir un bon volume d'entraînement. Je vais adapter en conséquence.` : `Connecte Strava pour que je puisse baser le plan sur tes données réelles !`}`
  }

  if (msg.includes('récup') || msg.includes('repos') || msg.includes('fatigue')) {
    return `La récupération est cruciale 💤\n\nPour évaluer ton état, je regarde :\n- **HRV** : variabilité cardiaque (plus c'est haut, mieux tu récupères)\n- **FC repos** : une hausse = signe de fatigue\n- **Sommeil** : qualité et durée\n- **ACWR** : ratio charge aiguë/chronique\n\n${hasWorkouts ? `Tes dernières séances montrent une bonne régularité. Assure-toi de garder au moins 1-2 jours de repos par semaine.` : `Connecte un wearable pour que je suive ta récupération en temps réel !`}`
  }

  return `Bonne question${name} ! 🤔\n\n⚠️ Le coaching IA avancé nécessite une clé OpenAI configurée. Pour l'instant, je peux t'aider avec :\n\n- 📋 Créer un plan d'entraînement\n- 💤 Analyser ta récupération\n- 📊 Décrypter tes métriques\n- ⚡ Optimiser tes zones d'entraînement\n\nPose-moi une question sur l'un de ces sujets !`
}
