import { MarketProvider } from '@/context/MarketContext';
import AppShell from '@/components/layout/AppShell';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <title>Vexel Gameshop</title>
        <link rel="icon" href="/vexel-logo.png" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#b7e7f3] text-slate-800 font-[Poppins] min-h-screen selection:bg-[#008bd0] selection:text-white pb-10">
        <MarketProvider>
          <AppShell>{children}</AppShell>
        </MarketProvider>
      </body>
    </html>
  );
}