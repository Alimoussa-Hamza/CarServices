'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@carservice/api-client';
import { colors, spacing, typography } from '@carservice/ui-tokens';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginAdmin } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@carservice.fr');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginAdmin(email.trim(), password);
      router.replace('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Connexion impossible.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: spacing[7],
        background: `linear-gradient(160deg, ${colors.brand.primaryLight} 0%, ${colors.neutral[100]} 55%)`,
      }}
    >
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <p
          style={{
            fontFamily: typography.fontFamily.sans,
            fontSize: typography.size.label,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: colors.brand.primary,
            marginBottom: spacing[3],
          }}
        >
          CARSERVICE
        </p>
        <h1 style={{ fontSize: typography.size.title, marginBottom: spacing[3] }}>
          Admin
        </h1>
        <p style={{ color: colors.neutral[700], marginBottom: spacing[7] }}>
          Connexion email / mot de passe (seed local).
        </p>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: spacing[5] }}>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? (
            <p style={{ color: colors.semantic.error, fontSize: 14 }}>{error}</p>
          ) : null}
          <Button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>
      </Card>
    </main>
  );
}
