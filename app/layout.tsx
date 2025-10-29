import './globals.css';
export const metadata = { title: 'SynPair Pro', description: 'Supervision multi-tokens Web3' };
export default function RootLayout({children}:{children:React.ReactNode}){
  return (<html lang="fr"><body className="min-h-dvh">{children}</body></html>);
}
