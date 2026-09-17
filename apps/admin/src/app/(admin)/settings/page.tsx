'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@carservice/api-client';
import type { AdminPlatformConfig } from '@carservice/shared-types';
import { colors, spacing, typography } from '@carservice/ui-tokens';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchAdminConfig, patchAdminConfig } from '@/lib/api';
import {
  diffConfigPatch,
  formValuesFromConfig,
  parseSettingsForm,
  type SettingsFormValues,
} from '@/lib/settings';

const EMPTY_FORM: SettingsFormValues = {
  commissionPercent: '',
  matchingTimeoutT1Minutes: '',
  matchingTimeoutT2Hours: '',
  matchingUnassignedLeadHours: '',
  cancelFreeHours: '',
  cancelLateHours: '',
  serviceFeeEuros: '',
};

export default function SettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<AdminPlatformConfig | null>(null);
  const [form, setForm] = useState<SettingsFormValues>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    const next = await fetchAdminConfig();
    setConfig(next);
    setForm(formValuesFromConfig(next));
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        await load();
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          router.replace('/login');
          return;
        }
        setError(
          err instanceof ApiError
            ? err.message
            : 'Impossible de charger la config.',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  function setField(key: keyof SettingsFormValues, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSave() {
    if (!config) {
      return;
    }
    const parsed = parseSettingsForm(form);
    if (!parsed) {
      setError('Valeur invalide (bornes commission / délais / frais).');
      setNotice(null);
      return;
    }
    const dto = diffConfigPatch(config, parsed);
    if (!dto) {
      setError('Aucun champ modifié.');
      setNotice(null);
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const next = await patchAdminConfig(dto);
      setConfig(next);
      setForm(formValuesFromConfig(next));
      setNotice('Config enregistrée.');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Enregistrement impossible.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p style={{ color: colors.neutral[700] }}>Chargement config…</p>;
  }

  if (!config && error) {
    return (
      <Card>
        <p style={{ color: colors.semantic.error }}>{error}</p>
      </Card>
    );
  }

  const updated = config?.updatedAt
    ? new Date(config.updatedAt).toLocaleString('fr-FR')
    : 'valeurs par défaut';

  return (
    <div style={{ display: 'grid', gap: spacing[7], maxWidth: 560 }}>
      <div>
        <h1 style={{ fontSize: typography.size.title }}>Config plateforme</h1>
        <p style={{ color: colors.neutral[700] }}>
          Commission, matching, annulation · maj {updated}
        </p>
      </div>

      <Card>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onSave();
          }}
          style={{ display: 'grid', gap: spacing[5] }}
        >
          <Field
            id="commission"
            label="Commission (%)"
            hint="Ex. 20 pour 20 % · exclus 0 et 100"
            value={form.commissionPercent}
            onChange={(value) => setField('commissionPercent', value)}
          />
          <Field
            id="t1"
            label="Matching T1 (minutes)"
            hint="1–240 · élargissement rayon"
            value={form.matchingTimeoutT1Minutes}
            onChange={(value) => setField('matchingTimeoutT1Minutes', value)}
          />
          <Field
            id="t2"
            label="Matching T2 (heures)"
            hint="1–48 · passage unassigned"
            value={form.matchingTimeoutT2Hours}
            onChange={(value) => setField('matchingTimeoutT2Hours', value)}
          />
          <Field
            id="lead"
            label="Lead unassigned (heures)"
            hint="1–24 · H-X avant le créneau"
            value={form.matchingUnassignedLeadHours}
            onChange={(value) => setField('matchingUnassignedLeadHours', value)}
          />
          <Field
            id="cancel-free"
            label="Annulation gratuite (heures)"
            hint="1–168 · RG-CANCEL"
            value={form.cancelFreeHours}
            onChange={(value) => setField('cancelFreeHours', value)}
          />
          <Field
            id="cancel-late"
            label="Seuil late (heures)"
            hint="1–48"
            value={form.cancelLateHours}
            onChange={(value) => setField('cancelLateHours', value)}
          />
          <Field
            id="fee"
            label="Frais de service (€)"
            hint="0–100,00"
            value={form.serviceFeeEuros}
            onChange={(value) => setField('serviceFeeEuros', value)}
          />

          {error ? (
            <p style={{ color: colors.semantic.error, fontSize: 14 }}>{error}</p>
          ) : null}
          {notice ? (
            <p style={{ color: colors.semantic.success, fontSize: 14 }}>{notice}</p>
          ) : null}

          <Button type="submit" disabled={busy}>
            Enregistrer
          </Button>
        </form>
      </Card>
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <p style={{ fontSize: 12, color: colors.neutral[500], marginTop: spacing[2] }}>
        {hint}
      </p>
    </div>
  );
}
