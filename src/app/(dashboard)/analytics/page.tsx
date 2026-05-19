import { createClient } from "@/lib/supabase/server";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("hr_max, hr_rest, vo2_max, vma, ftp, sport_primary").eq("id", user!.id).single();
  const { data: workouts } = await supabase.from("workouts").select("*").eq("user_id", user!.id).order("started_at", { ascending: false }).limit(50);
  const { data: health } = await supabase.from("health_metrics").select("*").eq("user_id", user!.id).order("date", { ascending: false }).limit(30);

  const hasData = workouts && workouts.length > 0;
  const now = Date.now();

  // Weekly volume (last 8 weeks)
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const weekStart = now - (i + 1) * 7 * 86400000;
    const weekEnd = now - i * 7 * 86400000;
    const weekWorkouts = workouts?.filter(w => {
      const t = new Date(w.started_at).getTime();
      return t >= weekStart && t < weekEnd;
    }) || [];
    return {
      label: `S-${i}`,
      sessions: weekWorkouts.length,
      km: weekWorkouts.reduce((s, w) => s + (w.distance_meters || 0), 0) / 1000,
      hours: weekWorkouts.reduce((s, w) => s + (w.duration_seconds || 0), 0) / 3600,
      tss: weekWorkouts.reduce((s, w) => s + (w.tss || 0), 0),
    };
  }).reverse();

  // ACWR
  const acuteLoad = weeks.slice(-1)[0]?.tss || weeks.slice(-1)[0]?.hours * 100 || 0;
  const chronicLoad = weeks.slice(-4).reduce((s, w) => s + (w.tss || w.hours * 100), 0) / 4;
  const acwr = chronicLoad > 0 ? (acuteLoad / chronicLoad).toFixed(2) : null;

  // Sport distribution
  const sportCounts: Record<string, number> = {};
  workouts?.forEach(w => { sportCounts[w.sport_type] = (sportCounts[w.sport_type] || 0) + 1; });
  const topSports = Object.entries(sportCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // HR zones (Karvonen)
  const hrMax = profile?.hr_max || 190;
  const hrRest = profile?.hr_rest || 60;
  const zones = [
    { name: "Z1 Récup", min: hrRest, max: Math.round(hrRest + 0.6 * (hrMax - hrRest)), color: "#3b82f6" },
    { name: "Z2 Aérobie", min: Math.round(hrRest + 0.6 * (hrMax - hrRest)), max: Math.round(hrRest + 0.7 * (hrMax - hrRest)), color: "#22c55e" },
    { name: "Z3 Tempo", min: Math.round(hrRest + 0.7 * (hrMax - hrRest)), max: Math.round(hrRest + 0.8 * (hrMax - hrRest)), color: "#eab308" },
    { name: "Z4 Seuil", min: Math.round(hrRest + 0.8 * (hrMax - hrRest)), max: Math.round(hrRest + 0.9 * (hrMax - hrRest)), color: "#f97316" },
    { name: "Z5 VO2max", min: Math.round(hrRest + 0.9 * (hrMax - hrRest)), max: hrMax, color: "#ef4444" },
  ];

  const sportIcons: Record<string, string> = {
    running: "🏃", cycling: "🚴", swimming: "🏊", trail_running: "🏔️",
    hiking: "🥾", strength: "🏋️", yoga: "🧘", walking: "🚶", other: "⚡",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>📈 Analytics</h1>

      {!hasData ? (
        <div className="p-8 rounded-2xl text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <span className="text-5xl mb-4 block">📊</span>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>Pas encore de données</h2>
          <p style={{ color: "var(--color-text-muted)" }}>Connecte Strava et synchronise tes activités pour voir tes analytics.</p>
          <a href="/settings" className="inline-block mt-4 px-6 py-3 rounded-xl font-medium text-white" style={{ background: "var(--color-accent)" }}>Connecter Strava</a>
        </div>
      ) : (
        <>
          {/* ACWR + Fitness indicators */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-5 rounded-2xl" style={{ background: "var(--color-surface)", border: `1px solid ${acwr && parseFloat(acwr) > 1.3 ? "rgba(239,68,68,0.4)" : "var(--color-border)"}` }}>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Ratio ACWR</p>
              <p className="text-3xl font-bold mt-1" style={{ color: acwr && parseFloat(acwr) > 1.3 ? "var(--color-danger)" : acwr && parseFloat(acwr) < 0.8 ? "var(--color-warning)" : "var(--color-success)" }}>
                {acwr || "—"}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{acwr && parseFloat(acwr) > 1.3 ? "⚠️ Risque élevé" : acwr && parseFloat(acwr) > 0.8 ? "✅ Zone optimale" : "📉 Charge faible"}</p>
            </div>
            <div className="p-5 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>VO2 Max</p>
              <p className="text-3xl font-bold mt-1" style={{ color: "var(--color-accent-blue)" }}>{profile?.vo2_max || "—"}</p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>ml/kg/min</p>
            </div>
            <div className="p-5 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>VMA</p>
              <p className="text-3xl font-bold mt-1" style={{ color: "var(--color-accent)" }}>{profile?.vma || "—"}</p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>km/h</p>
            </div>
            <div className="p-5 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>FTP</p>
              <p className="text-3xl font-bold mt-1" style={{ color: "var(--color-warning)" }}>{profile?.ftp || "—"}</p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>watts</p>
            </div>
          </div>

          {/* Weekly volume chart */}
          <div className="p-6 rounded-2xl mb-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>Volume hebdomadaire (8 semaines)</h2>
            <div className="flex items-end gap-2 h-40">
              {weeks.map((w, i) => {
                const maxHours = Math.max(...weeks.map(wk => wk.hours), 1);
                const height = (w.hours / maxHours) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{w.hours.toFixed(1)}h</span>
                    <div className="w-full rounded-t-lg transition-all" style={{ height: `${Math.max(height, 4)}%`, background: i === weeks.length - 1 ? "var(--color-accent)" : "var(--color-accent-blue)", opacity: i === weeks.length - 1 ? 1 : 0.6 }} />
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{w.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Sport distribution */}
            <div className="p-6 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>Répartition par sport</h2>
              <div className="space-y-3">
                {topSports.map(([sport, count]) => {
                  const pct = Math.round((count / (workouts?.length || 1)) * 100);
                  return (
                    <div key={sport}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>{sportIcons[sport] || "⚡"} {sport}</span>
                        <span style={{ color: "var(--color-text-muted)" }}>{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-surface-2)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--color-accent)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* HR Zones */}
            <div className="p-6 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>Zones FC (Karvonen)</h2>
              <div className="space-y-3">
                {zones.map((z, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: z.color }} />
                    <span className="text-sm flex-1">{z.name}</span>
                    <span className="text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>{z.min}-{z.max} bpm</span>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-4" style={{ color: "var(--color-text-muted)" }}>
                Basé sur FC max {hrMax} · FC repos {hrRest}
                {!profile?.hr_max && " (valeurs par défaut — mets à jour ton profil)"}
              </p>
            </div>
          </div>

          {/* Health trends */}
          {health && health.length > 0 && (
            <div className="p-6 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>Tendances santé (30 jours)</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {health.slice(0, 8).map((h, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: "var(--color-surface-2)" }}>
                    <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>{new Date(h.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                    <div className="space-y-1 text-xs">
                      {h.hrv_ms && <p>HRV: <strong>{h.hrv_ms}ms</strong></p>}
                      {h.resting_hr && <p>FC repos: <strong>{h.resting_hr}bpm</strong></p>}
                      {h.sleep_score && <p>Sommeil: <strong>{h.sleep_score}/100</strong></p>}
                      {h.recovery_score && <p>Récup: <strong>{h.recovery_score}/100</strong></p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
