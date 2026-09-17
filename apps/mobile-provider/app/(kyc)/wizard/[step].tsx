import { useEffect, useState } from 'react';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { KycWizardChrome } from '../../../src/components/kyc/wizard-chrome';
import {
  KycStepAvailability,
  KycStepCompany,
  KycStepFormulas,
  KycStepMethods,
  KycStepProfile,
  KycStepRcPro,
  KycStepZone,
} from '../../../src/components/kyc/step-fields';
import { submitKycDossier } from '../../../src/data/kyc';
import { mapApiError } from '../../../src/lib/api-errors';
import {
  canContinueKycStep,
  KYC_STEP_META,
  parseKycStep,
} from '../../../src/lib/kyc-validation';
import { syncKycAndResolveRoute } from '../../../src/lib/sync-session';
import { useKycDraftStore } from '../../../src/stores/kyc-draft.store';

export default function KycWizardStepScreen() {
  const params = useLocalSearchParams<{ step?: string }>();
  const step = parseKycStep(params.step);
  const draft = useKycDraftStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!step) {
      router.replace('/(kyc)/wizard/1' as Href);
    }
  }, [step]);

  if (!step) {
    return null;
  }

  const meta = KYC_STEP_META[step];
  const canContinue = canContinueKycStep(step, draft);

  const onBack = () => {
    if (step === 1) {
      return;
    }
    router.push(`/(kyc)/wizard/${step - 1}` as Href);
  };

  const onContinue = async () => {
    if (!canContinue) {
      return;
    }
    setError(null);
    if (step < 7) {
      router.push(`/(kyc)/wizard/${step + 1}` as Href);
      return;
    }
    setLoading(true);
    try {
      await submitKycDossier(draft);
      const route = await syncKycAndResolveRoute();
      router.replace(route as Href);
    } catch (err) {
      setError(mapApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KycWizardChrome
      step={step}
      title={meta.title}
      subtitle={meta.subtitle}
      ctaLabel={meta.cta}
      canContinue={canContinue}
      loading={loading}
      error={error}
      onBack={onBack}
      onContinue={() => void onContinue()}
    >
      {step === 1 ? <KycStepCompany /> : null}
      {step === 2 ? <KycStepRcPro /> : null}
      {step === 3 ? <KycStepMethods /> : null}
      {step === 4 ? <KycStepZone /> : null}
      {step === 5 ? <KycStepFormulas /> : null}
      {step === 6 ? <KycStepAvailability /> : null}
      {step === 7 ? <KycStepProfile /> : null}
    </KycWizardChrome>
  );
}
