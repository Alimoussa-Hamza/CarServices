'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { colors, spacing } from '@carservice/ui-tokens';
import { Button } from '@/components/ui/button';
import { bootstrapAdminApi, logoutAdmin } from '@/lib/api';
import { hasAdminSession } from '@/lib/auth-storage';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/kyc', label: 'KYC' },
  { href: '/catalog', label: 'Catalogue' },
  { href: '/zones', label: 'Zones' },
  { href: '/bookings', label: 'Réservations' },
  { href: '/disputes', label: 'Litiges' },
  { href: '/settings', label: 'Config' },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    bootstrapAdminApi();
    if (!hasAdminSession()) {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [router]);

  async function onLogout() {
    await logoutAdmin();
    router.replace('/login');
  }

  if (!ready) {
    return (
      <main style={{ padding: spacing[8], color: colors.neutral[700] }}>
        Chargement…
      </main>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 240,
          backgroundColor: colors.brand.secondary,
          color: colors.neutral[0],
          padding: spacing[7],
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[5],
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 18 }}>CARSERVICE</div>
        <nav style={{ display: 'grid', gap: spacing[3], flex: 1 }}>
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  color: colors.neutral[0],
                  textDecoration: 'none',
                  padding: `${spacing[3]}px ${spacing[4]}px`,
                  borderRadius: 8,
                  backgroundColor: active
                    ? 'rgba(255,255,255,0.15)'
                    : 'transparent',
                  fontSize: 14,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Button variant="secondary" onClick={onLogout}>
          Déconnexion
        </Button>
      </aside>
      <main style={{ flex: 1, padding: spacing[8], backgroundColor: colors.neutral[100] }}>
        {children}
      </main>
    </div>
  );
}
