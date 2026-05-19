"use client";
import { useEffect, useState } from "react";

type Athlete = {
  id: string;
  status: string;
  invite_code: string | null;
  athlete: { id: string; full_name: string; email: string; sport_primary: string; level: string } | null;
};

export default function CoachPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [inviteUrl, setInviteUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedAthlete, setSelectedAthlete] = useState<string | null>(null);
  const [athleteData, setAthleteData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => { loadAthletes(); }, []);

  const loadAthletes = async () => {
    setLoading(true);
    const res = await fetch("/api/coach");
    if (res.ok) {
      const data = await res.json();
      setAthletes(data.athletes);
    }
    setLoading(false);
  };

  const createInvite = async () => {
    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "invite" }),
    });
    if (res.ok) {
      const data = await res.json();
      setInviteUrl(data.inviteUrl);
      await loadAthletes();
    }
  };

  const removeAthlete = async (athleteId: string) => {
    await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", athleteId }),
    });
    setSelectedAthlete(null);
    setAthleteData(null);
    await loadAthletes();
  };

  const viewAthlete = async (athleteId: string) => {
    setSelectedAthlete(athleteId);
    const res = await fetch(`/api/coach/${athleteId}`);
    if (res.ok) {
      setAthleteData(await res.json());
    }
  };

  const activeAthletes = athletes.filter(a => a.status === "active" && a.athlete);

  if (selectedAthlete && athleteData) {
    const ad = athleteData as { profile: Record<string, string>; workouts: Record<string, unknown>[]; flags: { type: string; message: string }[]; acwr: string | null };
    return (
      <div>
        <button onClick={() => { setSelectedAthlete(null); setAthleteData(null); }} className="text-sm mb-4 flex items-center gap-1" style={{ color: "var(--color-accent)" }}>
          ← Retour aux athlètes
        </button>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{ background: "var(--color-surface-2)" }}>
            {ad.profile?.full_name?.[0] || "?"}
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{ad.profile?.full_name}</h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{ad.profile?.sport_primary} · {ad.profile?.level}</p>
          </div>
          {ad.acwr && (
            <span className="ml-auto px-3 py-1 rounded-full text-sm font-medium" style={{
              background: parseFloat(ad.acwr) > 1.3 ? "rgba(239,68,68,0.15)" : parseFloat(ad.acwr) < 0.8 ? "rgba(234,179,8,0.15)" : "rgba(34,197,94,0.15)",
              color: parseFloat(ad.acwr) > 1.3 ? "var(--color-danger)" : parseFloat(ad.acwr) < 0.8 ? "var(--color-warning)" : "var(--color-success)",
            }}>
              ACWR: {ad.acwr}
            </span>
          )}
        </div>

        {ad.flags?.length > 0 && (
          <div className="space-y-2 mb-6">
            {ad.flags.map((flag, i) => (
              <div key={i} className="p-3 rounded-xl text-sm" style={{
                background: flag.type === "danger" ? "rgba(239,68,68,0.1)" : "rgba(234,179,8,0.1)",
                border: `1px solid ${flag.type === "danger" ? "rgba(239,68,68,0.3)" : "rgba(234,179,8,0.3)"}`,
                color: flag.type === "danger" ? "var(--color-danger)" : "var(--color-warning)",
              }}>
                {flag.type === "danger" ? "🚨" : "⚠️"} {flag.message}
              </div>
            ))}
          </div>
        )}

        <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: "var(--font-display)" }}>Activités récentes</h2>
        <div className="space-y-2 mb-6">
          {ad.workouts?.slice(0, 10).map((w: Record<string, unknown>, i: number) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <span className="text-lg">{w.sport_type === "running" ? "🏃" : w.sport_type === "cycling" ? "🚴" : w.sport_type === "swimming" ? "🏊" : "🏋️"}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{w.title as string || w.sport_type as string}</p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {w.distance_meters ? ((w.distance_meters as number) / 1000).toFixed(1) + "km · " : ""}
                  {w.duration_seconds ? Math.round((w.duration_seconds as number) / 60) + "min" : ""}
                  {w.avg_hr ? " · " + w.avg_hr + "bpm" : ""}
                </p>
              </div>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{new Date(w.started_at as string).toLocaleDateString("fr")}</span>
            </div>
          ))}
          {(!ad.workouts || ad.workouts.length === 0) && (
            <p className="text-sm p-4 text-center" style={{ color: "var(--color-text-muted)" }}>Aucune activité. L&apos;athlète doit connecter Strava.</p>
          )}
        </div>

        <button onClick={() => removeAthlete(selectedAthlete)} className="text-xs px-3 py-1.5 rounded-lg" style={{ border: "1px solid var(--color-danger)", color: "var(--color-danger)" }}>
          Retirer cet athlète
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>🏋️ Dashboard Coach</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{activeAthletes.length} athlète{activeAthletes.length > 1 ? "s" : ""} actif{activeAthletes.length > 1 ? "s" : ""}</p>
        </div>
        <button onClick={createInvite} className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: "var(--color-accent)" }}>
          + Inviter un athlète
        </button>
      </div>

      {inviteUrl && (
        <div className="p-4 rounded-xl mb-6" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-accent)" }}>
          <p className="text-sm font-medium mb-2">🔗 Lien d&apos;invitation :</p>
          <div className="flex gap-2">
            <input readOnly value={inviteUrl} className="flex-1 px-3 py-2 rounded-lg text-xs" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} />
            <button onClick={() => { navigator.clipboard.writeText(inviteUrl); }} className="px-3 py-2 rounded-lg text-xs font-medium text-white" style={{ background: "var(--color-accent)" }}>
              Copier
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>Partagez ce lien à votre athlète pour qu&apos;il rejoigne votre suivi.</p>
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--color-text-muted)" }}>Chargement...</p>
      ) : activeAthletes.length === 0 ? (
        <div className="p-8 rounded-2xl text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <span className="text-5xl mb-4 block">👥</span>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>Aucun athlète</h2>
          <p className="mb-4" style={{ color: "var(--color-text-muted)" }}>Invitez vos athlètes pour voir leurs données en temps réel.</p>
          <button onClick={createInvite} className="px-6 py-3 rounded-xl font-medium text-white" style={{ background: "var(--color-accent)" }}>
            Créer un lien d&apos;invitation
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {activeAthletes.map((a) => (
            <div key={a.id} onClick={() => a.athlete && viewAthlete(a.athlete.id)} className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition hover:translate-y-[-1px]" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-medium" style={{ background: "var(--color-surface-2)" }}>
                {a.athlete?.full_name?.[0] || "?"}
              </div>
              <div className="flex-1">
                <p className="font-medium">{a.athlete?.full_name || a.athlete?.email}</p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{a.athlete?.sport_primary} · {a.athlete?.level}</p>
              </div>
              <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>→</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
