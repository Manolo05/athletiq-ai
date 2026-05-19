import Link from "next/link";

const features = [
  { icon: "🤖", title: "Coach IA 24/7", desc: "Conversation en temps réel avec un coach expert qui connaît tes données." },
  { icon: "📊", title: "Analytics avancés", desc: "VO2 max, charge d'entraînement, ratio ACWR, prédictions de performance." },
  { icon: "🔗", title: "Connecté à tes apps", desc: "Strava, Garmin, Apple Health, Fitbit, Polar — sync automatique." },
  { icon: "📋", title: "Plans adaptatifs", desc: "Plans d'entraînement IA qui s'ajustent après chaque séance." },
  { icon: "💤", title: "Score de récupération", desc: "HRV, sommeil, FC repos — ton corps te parle, on traduit." },
  { icon: "⚡", title: "Alertes surentraînement", desc: "Détection en temps réel des risques de blessure et fatigue." },
];

const pricing = [
  { name: "Free", price: "0€", features: ["5 messages IA/jour", "1 sport connecté", "Analytics de base", "Dashboard"], cta: "Commencer gratuitement", highlighted: false },
  { name: "Pro", price: "14,99€", period: "/mois", features: ["Messages IA illimités", "Tous les sports", "Analytics avancés", "Plans adaptatifs", "Prédictions VO2 max", "Export PDF"], cta: "Essai gratuit 14 jours", highlighted: true },
  { name: "Team", price: "39,99€", period: "/mois", features: ["Tout Pro inclus", "Jusqu'à 50 athlètes", "Dashboard coach", "API access", "Support prioritaire"], cta: "Contacter", highlighted: false },
];

export default function Home() {
  return (
    <main className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b" style={{ borderColor: "var(--color-border)", background: "rgba(10,10,10,0.8)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Athlet<span style={{ color: "var(--color-accent)" }}>IQ</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: "var(--color-text-muted)" }}>
            <a href="#features" className="hover:text-white transition">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-white transition">Tarifs</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm px-4 py-2 rounded-lg transition hover:bg-white/10">Connexion</Link>
            <Link href="/register" className="text-sm px-5 py-2 rounded-lg font-medium text-white transition" style={{ background: "var(--color-accent)" }}>Commencer</Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--color-success)" }}></span>
            Propulsé par GPT-4o
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6" style={{ fontFamily: "var(--font-display)" }}>
            Ton coach sportif<br /><span style={{ color: "var(--color-accent)" }}>alimenté par l&apos;IA</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10" style={{ color: "var(--color-text-muted)" }}>
            Connecte Strava, Garmin ou Apple Health. L&apos;IA analyse tes données, détecte les risques et génère des plans adaptatifs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="px-8 py-3.5 rounded-xl text-white font-semibold text-lg transition transform hover:scale-105" style={{ background: "var(--color-accent)" }}>Démarrer gratuitement →</Link>
            <a href="#features" className="px-8 py-3.5 rounded-xl font-medium transition" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>Découvrir</a>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ fontFamily: "var(--font-display)" }}>Tout pour <span style={{ color: "var(--color-accent)" }}>performer</span></h2>
          <p className="text-center mb-16 max-w-xl mx-auto" style={{ color: "var(--color-text-muted)" }}>Un coach IA qui comprend tes données physiologiques.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="p-6 rounded-2xl transition hover:translate-y-[-2px]" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "var(--font-display)" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16" style={{ fontFamily: "var(--font-display)" }}>Tarifs <span style={{ color: "var(--color-accent)" }}>simples</span></h2>
          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((plan, i) => (
              <div key={i} className="p-8 rounded-2xl flex flex-col" style={{ background: plan.highlighted ? "var(--color-surface-2)" : "var(--color-surface)", border: plan.highlighted ? "2px solid var(--color-accent)" : "1px solid var(--color-border)" }}>
                {plan.highlighted && <span className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--color-accent)" }}>Le plus populaire</span>}
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  {plan.period && <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>{plan.period}</span>}
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, j) => (<li key={j} className="flex items-center gap-2 text-sm"><span style={{ color: "var(--color-success)" }}>✓</span> {f}</li>))}
                </ul>
                <Link href="/register" className="w-full py-3 rounded-xl text-center font-medium transition" style={{ background: plan.highlighted ? "var(--color-accent)" : "transparent", color: plan.highlighted ? "white" : "var(--color-text)", border: plan.highlighted ? "none" : "1px solid var(--color-border)" }}>{plan.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 border-t" style={{ borderColor: "var(--color-border)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-bold" style={{ fontFamily: "var(--font-display)" }}>⚡ Athlet<span style={{ color: "var(--color-accent)" }}>IQ</span> AI</span>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>© 2026 AthletIQ AI. Tous droits réservés.</p>
        </div>
      </footer>
    </main>
  );
}
