import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/chat", label: "Coach IA", icon: "🤖" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/plans", label: "Plans", icon: "📋" },
  { href: "/coach", label: "Mes Athlètes", icon: "🏋️" },
  { href: "/profile", label: "Profil", icon: "👤" },
  { href: "/settings", label: "Réglages", icon: "⚙️" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, plan:subscriptions(plan)")
    .eq("id", user.id)
    .single();

  const planLabel = (profile as unknown as { plan: { plan: string }[] })?.plan?.[0]?.plan || "free";

  return (
    <div className="flex min-h-screen" style={{ background: "var(--color-bg)" }}>
      <aside className="hidden md:flex flex-col w-64 p-4 border-r" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
        <Link href="/" className="flex items-center gap-2 mb-8 px-3">
          <span className="text-xl">⚡</span>
          <span className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>Athlet<span style={{ color: "var(--color-accent)" }}>IQ</span></span>
        </Link>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition hover:bg-white/5" style={{ color: "var(--color-text-muted)" }}>
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-3 rounded-xl mt-auto" style={{ background: "var(--color-surface-2)" }}>
          <p className="text-sm font-medium truncate">{(profile as unknown as { full_name: string })?.full_name || user.email}</p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
            Plan {planLabel.charAt(0).toUpperCase() + planLabel.slice(1)}
          </p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
