import type { Metadata } from 'next';
import { colors } from '@carservice/ui-tokens';
import './globals.css';

export const metadata: Metadata = {
  title: 'CARSERVICE Admin',
  description: 'Back-office CARSERVICE',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body style={{ backgroundColor: colors.neutral[100] }}>{children}</body>
    </html>
  );
}
