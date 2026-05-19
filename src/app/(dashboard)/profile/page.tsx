"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (data) setProfile(data);
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      sport_primary: profile.sport_primary,
      level: profile.level,
      birth_date: profile.birth_date,
      gender: profile.gender,
      weight_kg: profile.weight_kg,
      height_cm: profile.height_cm,
      hr_max: profile.hr_max,
      hr_rest: profile.hr_rest,
      vo2_max: profile.vo2_max,
      vma: profile.vma,
      ftp: profile.ftp,
      updated_at: new Date().toISOString(),
    }).eq("id", profile.id);
    setSaving(false);
    setToast(error ? "❌ Erreur" : "✅ Profil sauvegardé !");
    setTimeout(() => setToast(""), 3000);
  };

  const set = (key: string, value: unknown) => setProfile(p => p ? { ...p, [key]: value } : null);

  if (!profile) return <p style={{ color: "var(--color-text-muted)" }}>Chargement...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>👤 Mon Profil</h1>
      {toast && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>{toast}</div>}

      <div className="space-y-6">
        <Section title="Informations personnelles">
          <Field label="Nom complet" value={profile.full_name as string || ""} onChange={v => set("full_name", v)} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Genre" value={profile.gender as string || ""} onChange={v => set("gender", v)} type="select" options={[["male","Homme"],["female","Femme"],["other","Autre"]]} />
            <Field label="Date de naissance" value={profile.birth_date as string || ""} onChange={v => set("birth_date", v)} type="date" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Poids (kg)" value={String(profile.weight_kg || "")} onChange={v => set("weight_kg", v ? parseFloat(v) : null)} type="number" />
            <Field label="Taille (cm)" value={String(profile.height_cm || "")} onChange={v => set("height_cm", v ? parseInt(v) : null)} type="number" />
          </div>
        </Section>

        <Section title="Sport">
          <Field label="Sport principal" value={profile.sport_primary as string || "running"} onChange={v => set("sport_primary", v)} type="select" options={[["running","Course à pied"],["cycling","Cyclisme"],["triathlon","Triathlon"],["swimming","Natation"],["trail_running","Trail"],["hiking","Randonnée"],["strength","Musculation"]]} />
          <Field label="Niveau" value={profile.level as string || "intermediate"} onChange={v => set("level", v)} type="select" options={[["beginner","Débutant"],["intermediate","Intermédiaire"],["advanced","Avancé"],["elite","Élite"]]} />
        </Section>

        <Section title="Données physiologiques">
          <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>Ces données améliorent la précision du coaching IA et des zones d&apos;entraînement.</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="FC max (bpm)" value={String(profile.hr_max || "")} onChange={v => set("hr_max", v ? parseInt(v) : null)} type="number" placeholder="Ex: 190" />
            <Field label="FC repos (bpm)" value={String(profile.hr_rest || "")} onChange={v => set("hr_rest", v ? parseInt(v) : null)} type="number" placeholder="Ex: 55" />
            <Field label="VO2 max (ml/kg/min)" value={String(profile.vo2_max || "")} onChange={v => set("vo2_max", v ? parseFloat(v) : null)} type="number" placeholder="Ex: 52.5" />
            <Field label="VMA (km/h)" value={String(profile.vma || "")} onChange={v => set("vma", v ? parseFloat(v) : null)} type="number" placeholder="Ex: 16.5" />
            <Field label="FTP (watts)" value={String(profile.ftp || "")} onChange={v => set("ftp", v ? parseInt(v) : null)} type="number" placeholder="Ex: 250" />
          </div>
        </Section>

        <button onClick={save} disabled={saving} className="w-full py-3 rounded-xl font-medium text-white transition disabled:opacity-50" style={{ background: "var(--color-accent)" }}>
          {saving ? "Sauvegarde..." : "Sauvegarder le profil"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-6 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, options }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; options?: string[][];
}) {
  const style = { background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-text)" };
  if (type === "select") {
    return (
      <div>
        <label className="text-sm font-medium block mb-1">{label}</label>
        <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm" style={style}>
          {options?.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
    );
  }
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={style} />
    </div>
  );
}
