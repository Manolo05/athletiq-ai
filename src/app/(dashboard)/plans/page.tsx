export default function PlansPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>📋 Plans d&apos;entraînement</h1>
      <div className="p-8 rounded-2xl text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <span className="text-5xl mb-4 block">🏋️</span>
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>Génère ton premier plan</h2>
        <p className="mb-6 max-w-md mx-auto" style={{ color: "var(--color-text-muted)" }}>
          L&apos;IA crée un plan personnalisé basé sur ton niveau, tes objectifs et tes données de récupération.
        </p>
        <button className="px-6 py-3 rounded-xl font-medium text-white transition" style={{ background: "var(--color-accent)" }}>
          Générer un plan IA ✨
        </button>
        <p className="text-xs mt-3" style={{ color: "var(--color-text-muted)" }}>Disponible avec le plan Pro</p>
      </div>
    </div>
  );
}
