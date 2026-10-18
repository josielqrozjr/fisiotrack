import type { Metadata } from 'next';
import './globals.css';
import { FisioTrackProvider } from '@/context/FisioTrackContext';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'FisioTrack | Avaliação e Rastreio em Fisioterapia Esportiva',
  description:
    'Sistema Web de Avaliação Pré-Participação (APP), Anamnese Esportiva, Testes Funcionais (LSI) e Testes Ortopédicos Especiais na Fisioterapia Esportiva.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#F8FAFC] text-slate-900">
        <FisioTrackProvider>
          <AppShell>{children}</AppShell>
        </FisioTrackProvider>
      </body>
    </html>
  );
}
