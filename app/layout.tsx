export const metadata = { title: "SynPair Pro", description: "Moniteur de paires synthétiques & supervision multi-sources" };
import "./globals.css";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
