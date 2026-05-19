"use client";
import { useState } from "react";

type Plan = { title: string; weeks: { week: number; sessions: { day: string; type: string; description: string; duration: string; intensity: string }[] }[] };

export default function PlansPage() {
  const [step, setStep] = useState<"form" | "loading" | "result">("form");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState({ sport: "running", goal: "10km", weeks: "8", sessionsPerWeek: "3", level: "intermediate" });

  const generate = async () => {
    setStep("loading");
    try {
      const res = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setPlan(data.plan);
        setStep("result");
      } else {
        setStep("form");
      }
    } catch {
      setStep("form");
    }
  };

  const intensityColors: Record<string, string> = {
    easy: "var(--color-success)", moderate: "var(--color-warning)",
    hard: "var(--color-accent)", rest: "var(--color-text-muted)",
  };

  if (step === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-accent)" }} />
        <p className="text-lg font-medium" style={{ fontFamily: "var(--font-display)" }}>L&apos;IA génère ton plan...</p>
        <p className="text-sm mt-2" style={{ color: "var(--color-text-muted)" }}>Analyse de tes données et optimisation</p>
      </div>
    );
  }

  if (step === "result" && plan) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>📋 {plan.title}</h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{plan.weeks.length} semaines · {form.sessionsPerWeek} séances/sem</p>
          </div>
          <button onClick={() => { setStep("form"); setPlan(null); }} className="px-4 py-2 rounded-xl text-sm" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
            ← Nouveau plan
          </button>
        </div>
        <div className="space-y-6">
          {plan.weeks.map((week) => (
            <div key={week.week} className="p-5 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <h3 className="font-semibold mb-3" style={{ fontFamily: "var(--font-display)" }}>Semaine {week.week}</h3>
              <div className="space-y-2">
                {week.sessions.map((s, j) => (
                  <div key={j} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--color-surface-2)" }}>
                    <div className="w-2 h-8 rounded-full" style={{ background: intensityColors[s.intensity] || "var(--color-text-muted)" }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{s.day}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-surface)", color: "var(--color-text-muted)" }}>{s.type}</span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{s.description}</p>
                    </div>
                    <span className="text-xs whitespace-nowrap" style={{ color: "var(--color-text-muted)" }}>{s.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>📋 Générateur de plans</h1>
      <div className="max-w-lg mx-auto p-8 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <span className="text-5xl mb-4 block text-center">🏋️</span>
        <h2 className="text-xl font-bold mb-6 text-center" style={{ fontFamily: "var(--font-display)" }}>Crée ton plan personnalisé</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Sport</label>
            <select value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}>
              <option value="running">🏃 Course à pied</option>
              <option value="cycling">🚴 Cyclisme</option>
              <option value="triathlon">🏊 Triathlon</option>
              <option value="trail">🏔️ Trail</option>
              <option value="swimming">🏊 Natation</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Objectif</label>
            <select value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}>
              <option value="5km">5km</option>
              <option value="10km">10km</option>
              <option value="semi">Semi-marathon</option>
              <option value="marathon">Marathon</option>
              <option value="ultra">Ultra-trail</option>
              <option value="fitness">Remise en forme</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Durée (semaines)</label>
              <select value={form.weeks} onChange={(e) => setForm({ ...form, weeks: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}>
                {[4, 6, 8, 10, 12, 16].map(w => <option key={w} value={w}>{w} semaines</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Séances / semaine</label>
              <select value={form.sessionsPerWeek} onChange={(e) => setForm({ ...form, sessionsPerWeek: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}>
                {[2, 3, 4, 5, 6].map(s => <option key={s} value={s}>{s}x / semaine</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Niveau</label>
            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}>
              <option value="beginner">Débutant</option>
              <option value="intermediate">Intermédiaire</option>
              <option value="advanced">Avancé</option>
              <option value="elite">Élite</option>
            </select>
          </div>
          <button onClick={generate} className="w-full py-3 rounded-xl font-medium text-white transition hover:opacity-90 mt-2" style={{ background: "var(--color-accent)" }}>
            Générer mon plan IA ✨
          </button>
        </div>
      </div>
    </div>
  );
}
