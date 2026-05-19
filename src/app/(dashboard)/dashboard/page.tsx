import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const { data: workouts } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", user!.id)
    .order("started_at", { ascending: false })
    .limit(5);

  const { data: health } = await supabase
    .from("health_metrics")
    .select("*")
    .eq("user_id", user!.id)
    .order("date", { ascending: false })
    .limit(1);

  const { data: weekWorkouts } = await supabase
    .from("workouts")
    .select("duration_seconds, distance_meters, tss, calories")
    .eq("user_id", user!.id)
    .gte("started_at", new Date(Date.now() - 7 * 86400000).toISOString());

  const { data: integrations } = await supabase
    .from("integrations")
    .select("provider")
    .eq("user_id", user!.id);

  const weekStats = {
    sessions: weekWorkouts?.length || 0,
    duration: weekWorkouts?.reduce((s, w) => s + (w.duration_seconds || 0), 0) || 0,
    distance: weekWorkouts?.reduce((s, w) => s + (w.distance_meters || 0), 0) || 0,
    tss: weekWorkouts?.reduce((s, w) => s + (w.tss || 0), 0) || 0,
    calories: weekWorkouts?.reduce((s, w) => s + (w.calories || 0), 0) || 0,
  };

  const latest = health?.[0];
  const hasIntegrations = integrations && integrations.length > 0;
  const hasWorkouts = workouts && workouts.length > 0;
  const name = profile?.full_name?.split(" ")[0] || "";

  const sportIcons: Record<string, string> = {
    running: "🏃", cycling: "🚴", swimming: "🏊", trail_running: "🏔️",
    hiking: "🥾", strength: "🏋️", yoga: "🧘", walking: "🚶", other: "⚡",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          {name ? `Salut ${name}` : "Dashboard"} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          {hasWorkouts ? "Voici ton résumé de la semaine" : "Bienvenue sur AthletIQ AI"}
        </p>
      </div>

      {!hasIntegrations && (
        <div className="p-5 rounded-2xl mb-6 flex items-center gap-4" style={{ background: "rgba(255,107,43,0.08)", border: "1px solid rgba(255,107,43,0.2)" }}>
          <span className="text-3xl">🔗</span>
          <div className="flex-1">
            <p className="font-medium text-sm">Connecte ton premier appareil</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Strava, Garmin, Fitbit ou Polar — pour que l&apos;IA analyse tes données.</p>
          </div>
          <a href="/settings" className="px-4 py-2 rounded-xl text-xs font-medium text-white" style={{ background: "var(--color-accent)" }}>Connecter</a>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Séances / semaine" value={String(weekStats.sessions)} icon="🏋️" color="var(--color-accent)" />
        <MetricCard label="Durée totale" value={weekStats.duration > 0 ? `${Math.round(weekStats.duration / 3600)}h${Math.round((weekStats.duration % 3600) / 60).toString().padStart(2, "0")}` : "—"} icon="⏱️" color="var(--color-accent-blue)" />
        <MetricCard label="Distance" value={weekStats.distance > 0 ? `${(weekStats.distance / 1000).toFixed(1)}km` : "—"} icon="📍" color="var(--color-success)" />
        <MetricCard label={latest?.recovery_score ? "Récupération" : "Score récup."} value={latest?.recovery_score ? `${latest.recovery_score}` : "—"} unit={latest?.recovery_score ? "/100" : ""} icon="💚" color={latest?.recovery_score && latest.recovery_score > 70 ? "var(--color-success)" : latest?.recovery_score ? "var(--color-warning)" : "var(--color-text-muted)"} />
      </div>

      {latest && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {latest.hrv_ms && <MiniMetric label="HRV" value={`${latest.hrv_ms}ms`} />}
          {latest.resting_hr && <MiniMetric label="FC repos" value={`${latest.resting_hr}bpm`} />}
          {latest.sleep_duration_minutes && <MiniMetric label="Sommeil" value={`${Math.floor(latest.sleep_duration_minutes / 60)}h${(latest.sleep_duration_minutes % 60).toString().padStart(2, "0")}`} />}
          {latest.steps && <MiniMetric label="Pas" value={latest.steps.toLocaleString("fr")} />}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>Activité récente</h2>
          {hasWorkouts ? (
            <div className="space-y-3">
              {workouts!.map((w, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: "var(--color-surface-2)" }}>
                  <span className="text-2xl">{sportIcons[w.sport_type] || "⚡"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{w.title || w.sport_type}</p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {w.distance_meters ? `${(w.distance_meters / 1000).toFixed(1)}km · ` : ""}
                      {w.duration_seconds ? `${Math.round(w.duration_seconds / 60)}min` : ""}
                      {w.avg_hr ? ` · ${w.avg_hr}bpm` : ""}
                      {w.perceived_effort ? ` · RPE ${w.perceived_effort}/10` : ""}
                    </p>
                  </div>
                  <span className="text-xs whitespace-nowrap" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(w.started_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="text-4xl mb-3 block">🏃</span>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                {hasIntegrations ? "Tes activités apparaîtront ici après la première sync." : "Connecte Strava pour voir tes activités."}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>💡 Coach IA</h2>
            <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
              {hasWorkouts ? "Basé sur tes données récentes :" : "Pose une question à ton coach IA pour commencer."}
            </p>
            <div className="space-y-2">
              {["Comment optimiser ma semaine ?", "Suis-je en surentraînement ?", "Crée un plan 10km"].map((q, i) => (
                <a key={i} href={`/chat`} className="block p-2.5 rounded-xl text-xs transition hover:translate-x-1" style={{ background: "var(--color-surface-2)", color: "var(--color-text-muted)" }}>
                  💬 {q}
                </a>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: "var(--font-display)" }}>📊 Cette semaine</h2>
            <div className="space-y-3">
              <WeekStat label="Charge (TSS)" value={weekStats.tss > 0 ? Math.round(weekStats.tss) : "—"} />
              <WeekStat label="Calories brûlées" value={weekStats.calories > 0 ? weekStats.calories.toLocaleString("fr") : "—"} />
              <WeekStat label="Apps connectées" value={integrations?.length || 0} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, unit, icon, color }: { label: string; value: string; unit?: string; icon: string; color: string }) {
  return (
    <div className="p-5 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{label}</span>
        <span>{icon}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold" style={{ color }}>{value}</span>
        {unit && <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>{unit}</span>}
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}

function WeekStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
