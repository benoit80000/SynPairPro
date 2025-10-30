// app/layout.tsx
export const metadata = { title: "SynPair Pro", description: "Supervision multi-sources & signaux" };
import "./globals.css";
import { useEffect } from "react";

function InitThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          try {
            var t = localStorage.getItem('theme') || 'dark';
            if (t === 'light') document.documentElement.classList.add('light');
            else document.documentElement.classList.remove('light');
          } catch(e){}
        `,
      }}
    />
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>{children}</body>
      <InitThemeScript />
    </html>
  );
}
