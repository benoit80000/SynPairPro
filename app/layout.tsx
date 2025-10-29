export const metadata = { title: "SynPair Pro", description: "Supervision multi-sources & signaux" };
import "./globals.css";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
