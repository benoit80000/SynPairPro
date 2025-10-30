export const metadata = { title: "SynPair Pro", description: "Supervision multi-sources & signaux" };
import "./globals.css";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>{children}</body>
      <script dangerouslySetInnerHTML={{__html:`
        try { const t = localStorage.getItem('theme') || 'dark'; document.documentElement.classList.toggle('light', t==='light'); } catch {}
      `}}/>
    </html>
  );
}
