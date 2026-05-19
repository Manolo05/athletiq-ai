import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AthletIQ AI — Coach Sportif IA",
  description: "Le ChatGPT du sport. Coach IA connecté à Strava, Garmin, Apple Health. Plans d'entraînement adaptatifs et analyses en temps réel.",
  keywords: ["coach sportif IA", "entraînement", "Strava", "running", "cyclisme", "VO2 max"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
