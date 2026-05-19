"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/callback` },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--color-bg)" }}>
        <div className="text-center max-w-md">
          <span className="text-5xl mb-4 block">📧</span>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>Vérifie ton email</h1>
          <p style={{ color: "var(--color-text-muted)" }}>Un lien de confirmation a été envoyé à <strong>{email}</strong>.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--color-bg)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>⚡ Athlet<span style={{ color: "var(--color-accent)" }}>IQ</span></Link>
          <h1 className="text-2xl font-bold mt-6" style={{ fontFamily: "var(--font-display)" }}>Créer un compte</h1>
          <p className="text-sm mt-2" style={{ color: "var(--color-text-muted)" }}>Commence ton coaching IA gratuit</p>
        </div>
        <div className="p-8 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <form onSubmit={handleRegister} className="space-y-4">
            <input type="text" placeholder="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} />
            <input type="password" placeholder="Mot de passe (min 6 caractères)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} />
            {error && <p className="text-sm" style={{ color: "var(--color-danger)" }}>{error}</p>}
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-medium text-white transition" style={{ background: "var(--color-accent)" }}>
              {loading ? "Création..." : "Créer mon compte"}
            </button>
          </form>
        </div>
        <p className="text-center text-sm mt-6" style={{ color: "var(--color-text-muted)" }}>
          Déjà un compte ? <Link href="/login" className="font-medium" style={{ color: "var(--color-accent)" }}>Se connecter</Link>
        </p>
      </div>
    </main>
  );
}
