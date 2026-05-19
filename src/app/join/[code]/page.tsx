"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function JoinPage() {
  const { code } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState<"loading" | "ready" | "success" | "error" | "login">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setStatus("login");
      return;
    }
    setStatus("ready");
  };

  const accept = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", inviteCode: code }),
      });

      if (res.ok) {
        setStatus("success");
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Erreur inconnue");
        setStatus("error");
      }
    } catch {
      setError("Erreur réseau");
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--color-bg)" }}>
      <div className="w-full max-w-md text-center">
        <Link href="/" className="text-2xl font-bold mb-8 block" style={{ fontFamily: "var(--font-display)" }}>
          ⚡ Athlet<span style={{ color: "var(--color-accent)" }}>IQ</span>
        </Link>

        {status === "loading" && <p style={{ color: "var(--color-text-muted)" }}>Chargement...</p>}

        {status === "login" && (
          <div className="p-8 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <span className="text-5xl mb-4 block">🏋️</span>
            <h1 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>Invitation coach</h1>
            <p className="mb-6" style={{ color: "var(--color-text-muted)" }}>Connecte-toi ou crée un compte pour rejoindre ton coach.</p>
            <Link href={`/login?redirect=/join/${code}`} className="block w-full py-3 rounded-xl font-medium text-white mb-3" style={{ background: "var(--color-accent)" }}>
              Se connecter
            </Link>
            <Link href={`/register?redirect=/join/${code}`} className="block w-full py-3 rounded-xl font-medium" style={{ border: "1px solid var(--color-border)", color: "var(--color-text)" }}>
              Créer un compte
            </Link>
          </div>
        )}

        {status === "ready" && (
          <div className="p-8 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <span className="text-5xl mb-4 block">🤝</span>
            <h1 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>Rejoindre un coach</h1>
            <p className="mb-6" style={{ color: "var(--color-text-muted)" }}>
              Ton coach veut suivre ton entraînement. En acceptant, il pourra voir tes activités et métriques de santé.
            </p>
            <button onClick={accept} className="w-full py-3 rounded-xl font-medium text-white" style={{ background: "var(--color-accent)" }}>
              Accepter l&apos;invitation
            </button>
          </div>
        )}

        {status === "success" && (
          <div className="p-8 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <span className="text-5xl mb-4 block">✅</span>
            <h1 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>Connecté !</h1>
            <p style={{ color: "var(--color-text-muted)" }}>Ton coach peut maintenant suivre tes données. Redirection...</p>
          </div>
        )}

        {status === "error" && (
          <div className="p-8 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <span className="text-5xl mb-4 block">❌</span>
            <h1 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>Erreur</h1>
            <p style={{ color: "var(--color-danger)" }}>{error}</p>
            <Link href="/dashboard" className="block mt-4 text-sm" style={{ color: "var(--color-accent)" }}>Retour au dashboard</Link>
          </div>
        )}
      </div>
    </main>
  );
}
