"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

type Integration = { provider: string; last_sync_at: string | null; sync_enabled: boolean };

const connectors = [
  { name: "Strava", icon: "🟠", provider: "strava", available: true },
  { name: "Garmin", icon: "🔵", provider: "garmin", available: false },
  { name: "Apple Health", icon: "❤️", provider: "apple_health", available: false },
  { name: "Fitbit", icon: "🟢", provider: "fitbit", available: false },
  { name: "Polar", icon: "⚪", provider: "polar", available: false },
];

function SettingsContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success === "strava") setToast("✅ Strava connecté avec succès !");
    if (error) setToast("❌ Erreur de connexion : " + error);
    if (success || error) setTimeout(() => setToast(""), 4000);

    loadIntegrations();
  }, [searchParams]);

  const loadIntegrations = async () => {
    const { data } = await supabase.from("integrations").select("provider, last_sync_at, sync_enabled");
    if (data) setIntegrations(data);
  };

  const isConnected = (provider: string) => integrations.some((i) => i.provider === provider);
  const getIntegration = (provider: string) => integrations.find((i) => i.provider === provider);

  const handleConnect = (provider: string) => {
    if (provider === "strava") {
      window.location.href = "/api/integrations/strava";
    }
  };

  const handleDisconnect = async (provider: string) => {
    await supabase.from("integrations").delete().eq("provider", provider);
    await loadIntegrations();
  };

  const handleSync = async (provider: string) => {
    if (provider !== "strava") return;
    setSyncing(true);
    try {
      const res = await fetch("/api/integrations/strava/sync", { method: "POST" });
      const data = await res.json();
      setToast(`✅ ${data.synced} activités synchronisées !`);
      setTimeout(() => setToast(""), 4000);
    } catch {
      setToast("❌ Erreur de synchronisation");
      setTimeout(() => setToast(""), 4000);
    }
    setSyncing(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>⚙️ Réglages</h1>

      {toast && (
        <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
          {toast}
        </div>
      )}

      <div className="p-6 rounded-2xl mb-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>Connexions</h2>
        <div className="space-y-3">
          {connectors.map((c) => {
            const connected = isConnected(c.provider);
            const integration = getIntegration(c.provider);
            return (
              <div key={c.provider} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--color-surface-2)" }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{c.icon}</span>
                  <div>
                    <span className="font-medium text-sm">{c.name}</span>
                    {connected && integration?.last_sync_at && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                        Sync : {new Date(integration.last_sync_at).toLocaleDateString("fr")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {connected ? (
                    <>
                      <button onClick={() => handleSync(c.provider)} disabled={syncing} className="px-3 py-1.5 rounded-lg text-xs font-medium transition" style={{ background: "var(--color-accent)", color: "white" }}>
                        {syncing ? "Sync..." : "Sync"}
                      </button>
                      <button onClick={() => handleDisconnect(c.provider)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition" style={{ border: "1px solid var(--color-danger)", color: "var(--color-danger)" }}>
                        Déconnecter
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => c.available && handleConnect(c.provider)}
                      className="px-4 py-1.5 rounded-lg text-xs font-medium transition"
                      style={{
                        border: `1px solid ${c.available ? "var(--color-accent)" : "var(--color-border)"}`,
                        color: c.available ? "var(--color-accent)" : "var(--color-text-muted)",
                        cursor: c.available ? "pointer" : "not-allowed",
                        opacity: c.available ? 1 : 0.5,
                      }}
                    >
                      {c.available ? "Connecter" : "Bientôt"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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

export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{ color: "var(--color-text-muted)" }}>Chargement...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
