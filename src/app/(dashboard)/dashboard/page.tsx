import { createClient } from "@/lib/supabase/server";

const metrics = [
  { label: "Score récupération", value: "78", unit: "/100", color: "var(--color-success)", icon: "💚" },
  { label: "Charge entraînement", value: "342", unit: "TSS", color: "var(--color-accent)", icon: "🔥" },
  { label: "FC repos", value: "52", unit: "bpm", color: "var(--color-accent-blue)", icon: "❤️" },
  { label: "Sommeil", value: "7h42", unit: "", color: "var(--color-warning)", icon: "💤" },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          Bonjour{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Voici ton résumé du jour</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((m, i) => (
          <div key={i} className="p-5 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{m.label}</span>
              <span>{m.icon}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold" style={{ color: m.color }}>{m.value}</span>
              <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>{m.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>Activité récente</h2>
          <div className="space-y-3">
            {[
              { type: "🏃", title: "Course 10km", time: "Aujourd'hui", stat: "48:32 · 4:51/km" },
              { type: "🚴", title: "Sortie vélo", time: "Hier", stat: "42km · 198W moy" },
              { type: "🏊", title: "Natation", time: "Lun", stat: "2km · 1:48/100m" },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: "var(--color-surface-2)" }}>
                <span className="text-2xl">{a.type}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{a.title}</p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{a.stat}</p>
                </div>
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>💡 Insights IA</h2>
          <div className="space-y-3">
            <div className="p-3 rounded-xl text-sm" style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)" }}>
              <p className="font-medium" style={{ color: "var(--color-success)" }}>Récupération optimale</p>
              <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>Ton HRV est en hausse de 8% cette semaine. Bon moment pour une séance intense.</p>
            </div>
            <div className="p-3 rounded-xl text-sm" style={{ background: "rgba(234, 179, 8, 0.1)", border: "1px solid rgba(234, 179, 8, 0.2)" }}>
              <p className="font-medium" style={{ color: "var(--color-warning)" }}>Attention sommeil</p>
              <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>Ton sommeil profond a diminué de 15min. Vise 23h max pour te coucher.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
