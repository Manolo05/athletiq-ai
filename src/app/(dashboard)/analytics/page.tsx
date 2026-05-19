export default function AnalyticsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>📈 Analytics</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl h-64 flex items-center justify-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p style={{ color: "var(--color-text-muted)" }}>Graphique VO2 Max — Connecte un appareil pour voir tes données</p>
        </div>
        <div className="p-6 rounded-2xl h-64 flex items-center justify-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p style={{ color: "var(--color-text-muted)" }}>Charge d&apos;entraînement — Connecte Strava pour commencer</p>
        </div>
        <div className="p-6 rounded-2xl h-64 flex items-center justify-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p style={{ color: "var(--color-text-muted)" }}>Profil radar — Données insuffisantes</p>
        </div>
        <div className="p-6 rounded-2xl h-64 flex items-center justify-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p style={{ color: "var(--color-text-muted)" }}>Sommeil & Récupération — Connecte un wearable</p>
        </div>
      </div>
    </div>
  );
}
