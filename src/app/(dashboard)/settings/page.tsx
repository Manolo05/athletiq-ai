"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const connectors = [
  { name: "Strava", icon: "🟠", connected: false },
  { name: "Garmin", icon: "🔵", connected: false },
  { name: "Apple Health", icon: "❤️", connected: false },
  { name: "Fitbit", icon: "🟢", connected: false },
  { name: "Polar", icon: "⚪", connected: false },
];

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>⚙️ Réglages</h1>

      <div className="p-6 rounded-2xl mb-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>Connexions</h2>
        <div className="space-y-3">
          {connectors.map((c, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--color-surface-2)" }}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{c.icon}</span>
                <span className="font-medium text-sm">{c.name}</span>
              </div>
              <button className="px-4 py-1.5 rounded-lg text-xs font-medium transition" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                Connecter
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-2xl mb-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>Abonnement</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Plan Free</p>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>5 messages IA/jour · 1 sport</p>
          </div>
          <button className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: "var(--color-accent)" }}>
            Passer Pro ⚡
          </button>
        </div>
      </div>

      <button onClick={handleLogout} className="px-4 py-2 rounded-xl text-sm transition" style={{ border: "1px solid var(--color-danger)", color: "var(--color-danger)" }}>
        Se déconnecter
      </button>
    </div>
  );
}
