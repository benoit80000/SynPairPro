import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "SynPair Pro",
  description: "Monitoring • Ratios • AI Insights",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <header className="px-6 py-4 border-b border-white/10 bg-black/20 backdrop-blur">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <img src="/logo-synpair.svg" alt="SynPair Pro" className="h-12 md:h-16 w-auto" />
            <div>
              <div className="text-2xl md:text-3xl font-extrabold">SynPair Pro</div>
              <div className="text-sm text-white/60">Monitoring • Ratios • AI Insights</div>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}