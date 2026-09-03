import { colors } from '@carservice/ui-tokens';

async function getApiStatus(): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/v1/health`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return 'indisponible';
    const body = (await res.json()) as { data?: { status?: string } };
    return body.data?.status ?? 'inconnu';
  } catch {
    return 'hors ligne';
  }
}

export default async function HomePage() {
  const apiStatus = await getApiStatus();

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 24,
      }}
    >
      <h1 style={{ color: colors.brand.primary, fontSize: 32 }}>
        CARSERVICE Admin
      </h1>
      <p style={{ color: colors.neutral[700] }}>
        Back-office MVP — lavage à domicile
      </p>
      <div
        style={{
          marginTop: 24,
          padding: '12px 20px',
          borderRadius: 12,
          backgroundColor: colors.neutral[0],
          border: `1px solid ${colors.neutral[300]}`,
        }}
      >
        API : <strong>{apiStatus}</strong>
      </div>
    </main>
  );
}
