"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

type Integration = { provider: string; last_sync_at: string | null; sync_enabled: boolean };

const connectors = [
  { name: "Strava", icon: "🟠", provider: "strava", envKey: "STRAVA_CLIENT_ID" },
  { name: "Garmin", icon: "🔵", provider: "garmin", envKey: "GARMIN_CLIENT_ID" },
  { name: "Fitbit", icon: "🟢", provider: "fitbit", envKey: "FITBIT_CLIENT_ID" },
  { name: "Polar", icon: "⚪", provider: "polar", envKey: "POLAR_CLIENT_ID" },
  { name: "Apple Health", icon: "❤️", provider: "apple_health", envKey: null },
];

function SettingsContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success) {
      setToast(`✅ ${success.charAt(0).toUpperCase() + success.slice(1)} connecté avec succès !`);
      // Clean URL
      window.history.replaceState({}, "", "/settings");
    }
    if (error) {
      const provider = error.split("_")[0];
      setToast(`❌ Erreur de connexion ${provider} : ${error}`);
      window.history.replaceState({}, "", "/settings");
    }
    if (success || error) setTimeout(() => setToast(""), 5000);
    loadIntegrations();
  }, [searchParams]);

  const loadIntegrations = async () => {
    const { data } = await supabase.from("integrations").select("provider, last_sync_at, sync_enabled");
    if (data) setIntegrations(data);
  };

  const isConnected = (provider: string) => integrations.some((i) => i.provider === provider);
  const getIntegration = (provider: string) => integrations.find((i) => i.provider === provider);

  const handleConnect = (provider: string) => {
    window.location.href = `/api/integrations/${provider}`;
  };

  const handleDisconnect = async (provider: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("integrations").delete().eq("provider", provider).eq("user_id", user.id);
    setToast(`🗑️ ${provider} déconnecté`);
    setTimeout(() => setToast(""), 3000);
    await loadIntegrations();
  };

  const handleSync = async (provider: string) => {
    setSyncing(provider);
    try {
      const res = await fetch(`/api/integrations/${provider}/sync`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setToast(`✅ ${data.synced} activités synchronisées depuis ${provider} !`);
      } else {
        setToast(`❌ Erreur de sync ${provider}`);
      }
    } catch {
      setToast(`❌ Erreur de sync ${provider}`);
    }
    setTimeout(() => setToast(""), 4000);
    setSyncing(null);
    await loadIntegrations();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>⚙️ Réglages</h1>

      {toast && (
        <div className="mb-4 p-3 rounded-xl text-sm animate-pulse" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
          {toast}
        </div>
      )}

      <div className="p-6 rounded-2xl mb-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <h2 className="text-lg font-semibold mb-2" style={{ fontFamily: "var(--font-display)" }}>Connexions</h2>
        <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
          Connecte tes apps sportives pour synchroniser automatiquement tes activités.
        </p>
        <div className="space-y-3">
          {connectors.map((c) => {
            const connected = isConnected(c.provider);
            const integration = getIntegration(c.provider);
            const isAppleHealth = c.provider === "apple_health";
            return (
              <div key={c.provider} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--color-surface-2)" }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{c.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{c.name}</span>
                      {connected && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "var(--color-success)" }}>
                          Connecté
                        </span>
                      )}
                    </div>
                    {connected && integration?.last_sync_at && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                        Dernière sync : {new Date(integration.last_sync_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {connected ? (
                    <>
                      {c.provider === "strava" && (
                        <button
                          onClick={() => handleSync(c.provider)}
                          disabled={syncing === c.provider}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                          style={{ background: "var(--color-accent)", color: "white" }}
                        >
                          {syncing === c.provider ? "⏳ Sync..." : "🔄 Sync"}
                        </button>
                      )}
                      <button
                        onClick={() => handleDisconnect(c.provider)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80"
                        style={{ border: "1px solid var(--color-danger)", color: "var(--color-danger)" }}
                      >
                        Déconnecter
                      </button>
                    </>
                  ) : isAppleHealth ? (
                    <span className="text-xs px-3 py-1.5 rounded-lg" style={{ color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}>
                      App iOS requise
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConnect(c.provider)}
                      className="px-4 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80"
                      style={{ border: "1px solid var(--color-accent)", color: "var(--color-accent)" }}
                    >
                      Connecter
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

      <button onClick={handleLogout} className="px-4 py-2 rounded-xl text-sm transition hover:opacity-80" style={{ border: "1px solid var(--color-danger)", color: "var(--color-danger)" }}>
        Se déconnecter
      </button>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8" style={{ color: "var(--color-text-muted)" }}>Chargement des réglages...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
