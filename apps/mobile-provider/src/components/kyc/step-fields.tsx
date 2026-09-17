import { Pressable, Text, View } from 'react-native';
import {
  clampRadiusKm,
  defaultFutureExpiry,
  formatFrDate,
  formatSiretDisplay,
  KYC_FORMULAS,
  TIME_CHIPS,
  toIsoDate,
  WEEK_DAYS,
} from '../../lib/kyc-validation';
import { useKycDraftStore } from '../../stores/kyc-draft.store';
import { useTheme } from '../../theme/theme-provider';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { DateWheel } from './date-wheel';
import { KycToggle } from './toggle';

export function KycStepCompany() {
  const companyName = useKycDraftStore((s) => s.companyName);
  const siret = useKycDraftStore((s) => s.siret);
  const patch = useKycDraftStore((s) => s.patch);

  return (
    <>
      <Input
        testID="kyc-company-name"
        label="Nom de l'entreprise"
        value={companyName}
        onChangeText={(value) => patch({ companyName: value })}
        autoCapitalize="words"
      />
      <Input
        testID="kyc-siret"
        label="Numéro SIRET"
        value={formatSiretDisplay(siret)}
        onChangeText={(value) => patch({ siret: formatSiretDisplay(value) })}
        keyboardType="number-pad"
        maxLength={17}
        helper="14 chiffres, visible sur votre extrait Kbis ou avis de situation INSEE."
      />
    </>
  );
}

export function KycStepRcPro() {
  const { colors, radius, spacing, typography } = useTheme();
  const rcSelected = useKycDraftStore((s) => s.rcSelected);
  const rcExpiresAt = useKycDraftStore((s) => s.rcExpiresAt);
  const patch = useKycDraftStore((s) => s.patch);

  return (
    <>
      <Pressable
        testID="kyc-rc-file"
        onPress={() => {
          const expiry = defaultFutureExpiry();
          patch({
            rcSelected: true,
            rcExpiresAt:
              rcExpiresAt || toIsoDate(expiry.year, expiry.month, expiry.day),
          });
        }}
        style={{
          backgroundColor: colors.neutral[0],
          borderRadius: radius.md,
          borderWidth: 2,
          borderColor: rcSelected ? colors.brand.primary : colors.neutral[300],
          borderStyle: 'dashed',
          minHeight: 88,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing[5],
        }}
      >
        <Text
          style={{
            color: colors.neutral[900],
            fontSize: typography.size.body,
            fontWeight: '600',
          }}
        >
          {rcSelected ? 'rc-pro.pdf' : 'Ajouter l’attestation RC Pro'}
        </Text>
        <Text
          style={{
            color: colors.neutral[500],
            fontSize: typography.size.label,
            marginTop: spacing[2],
          }}
        >
          PDF ou JPG · mock local
        </Text>
      </Pressable>
      <View>
        <Text
          style={{
            color: colors.neutral[900],
            fontSize: typography.size.caption,
            fontWeight: '600',
            marginBottom: spacing[2],
          }}
        >
          Date d’expiration
        </Text>
        <View
          style={{
            minHeight: 56,
            borderRadius: radius.md,
            borderWidth: 2,
            borderColor: rcExpiresAt ? colors.brand.primary : colors.neutral[300],
            backgroundColor: colors.neutral[0],
            justifyContent: 'center',
            paddingHorizontal: spacing[5],
            marginBottom: spacing[4],
          }}
        >
          <Text
            testID="kyc-rc-date"
            style={{
              color: rcExpiresAt ? colors.neutral[900] : colors.neutral[500],
              fontSize: typography.size.body,
              fontWeight: '500',
            }}
          >
            {rcExpiresAt ? formatFrDate(rcExpiresAt) : 'Choisir sur la roue'}
          </Text>
        </View>
      </View>
      <DateWheel
        testID="kyc-date-wheel"
        value={rcExpiresAt}
        onChange={(iso) => patch({ rcExpiresAt: iso })}
      />
    </>
  );
}

export function KycStepMethods() {
  const { colors, radius, spacing, typography } = useTheme();
  const waterless = useKycDraftStore((s) => s.waterless);
  const steam = useKycDraftStore((s) => s.steam);
  const patch = useKycDraftStore((s) => s.patch);

  return (
    <>
      <View
        style={{
          backgroundColor: colors.neutral[0],
          borderRadius: radius.md,
          padding: spacing[5],
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1, paddingRight: spacing[4] }}>
          <Text
            style={{
              color: colors.neutral[900],
              fontSize: typography.size.caption,
              fontWeight: '600',
            }}
          >
            Sans eau
          </Text>
          <Text style={{ color: colors.neutral[500], fontSize: typography.size.label }}>
            Produits biodégradables, sans point d’eau
          </Text>
        </View>
        <KycToggle
          testID="kyc-method-waterless"
          value={waterless}
          onChange={(value) => patch({ waterless: value })}
        />
      </View>
      <View
        style={{
          backgroundColor: colors.neutral[0],
          borderRadius: radius.md,
          padding: spacing[5],
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1, paddingRight: spacing[4] }}>
          <Text
            style={{
              color: colors.neutral[900],
              fontSize: typography.size.caption,
              fontWeight: '600',
            }}
          >
            Vapeur
          </Text>
          <Text style={{ color: colors.neutral[500], fontSize: typography.size.label }}>
            Haute température, sans détergent
          </Text>
        </View>
        <KycToggle
          testID="kyc-method-steam"
          value={steam}
          onChange={(value) => patch({ steam: value })}
        />
      </View>
      <Text style={{ color: colors.neutral[500], fontSize: typography.size.label }}>
        Au moins une méthode est requise. Le detailing se choisit à l’étape des
        formules, pas ici.
      </Text>
    </>
  );
}

export function KycStepZone() {
  const { colors, radius, spacing, typography } = useTheme();
  const zoneAddress = useKycDraftStore((s) => s.zoneAddress);
  const radiusKm = useKycDraftStore((s) => s.radiusKm);
  const patch = useKycDraftStore((s) => s.patch);

  return (
    <>
      <Input
        testID="kyc-zone-address"
        label="Adresse de départ"
        value={zoneAddress}
        onChangeText={(value) => patch({ zoneAddress: value })}
        placeholder="12 rue de la République, 69002 Lyon"
      />
      <View
        style={{
          height: 160,
          borderRadius: radius.md,
          backgroundColor: colors.brand.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: colors.brand.primary,
          }}
        />
        <Text
          style={{
            color: colors.neutral[900],
            fontSize: typography.size.caption,
            fontWeight: '600',
            marginTop: spacing[3],
          }}
        >
          1 pin · rayon {radiusKm} km
        </Text>
        <Text style={{ color: colors.neutral[500], fontSize: typography.size.label }}>
          Carte interactive plus tard (EAS)
        </Text>
      </View>
      <View
        style={{
          backgroundColor: colors.neutral[0],
          borderRadius: radius.md,
          padding: spacing[5],
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            color: colors.neutral[900],
            fontSize: typography.size.caption,
            fontWeight: '600',
          }}
        >
          Rayon
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
          <Pressable
            testID="kyc-radius-minus"
            onPress={() => patch({ radiusKm: clampRadiusKm(radiusKm - 5) })}
          >
            <Text style={{ color: colors.brand.primary, fontWeight: '700', fontSize: 22 }}>
              −
            </Text>
          </Pressable>
          <Text
            testID="kyc-radius-value"
            style={{
              color: colors.neutral[900],
              fontWeight: '700',
              minWidth: 56,
              textAlign: 'center',
            }}
          >
            {radiusKm} km
          </Text>
          <Pressable
            testID="kyc-radius-plus"
            onPress={() => patch({ radiusKm: clampRadiusKm(radiusKm + 5) })}
          >
            <Text style={{ color: colors.brand.primary, fontWeight: '700', fontSize: 22 }}>
              +
            </Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

export function KycStepFormulas() {
  const formulas = useKycDraftStore((s) => s.formulas);
  const toggleFormula = useKycDraftStore((s) => s.toggleFormula);
  const { colors, radius, spacing } = useTheme();

  return (
    <>
      {KYC_FORMULAS.map((formula) => (
        <View
          key={formula.key}
          style={{
            backgroundColor: colors.neutral[0],
            borderRadius: radius.md,
            padding: spacing[5],
          }}
        >
          <Checkbox
            testID={`kyc-formula-${formula.key}`}
            checked={formulas.includes(formula.key)}
            onChange={() => toggleFormula(formula.key)}
            label={`${formula.label} — ${formula.hint}`}
          />
        </View>
      ))}
    </>
  );
}

export function KycStepAvailability() {
  const { colors, radius, spacing, typography } = useTheme();
  const days = useKycDraftStore((s) => s.days);
  const timeChipIndexes = useKycDraftStore((s) => s.timeChipIndexes);
  const toggleDay = useKycDraftStore((s) => s.toggleDay);
  const toggleTimeChip = useKycDraftStore((s) => s.toggleTimeChip);

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {WEEK_DAYS.map((day) => {
          const active = days.includes(day.key);
          return (
            <Pressable
              key={day.key}
              testID={`kyc-day-${day.key}`}
              onPress={() => toggleDay(day.key)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? colors.brand.primary : colors.neutral[0],
                borderWidth: active ? 0 : 2,
                borderColor: colors.neutral[300],
              }}
            >
              <Text
                style={{
                  color: active ? colors.neutral[0] : colors.neutral[500],
                  fontSize: typography.size.label,
                  fontWeight: '700',
                }}
              >
                {day.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text
        style={{
          color: colors.neutral[900],
          fontSize: typography.size.caption,
          fontWeight: '600',
        }}
      >
        Créneaux horaires
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>
        {TIME_CHIPS.map((chip, index) => {
          const active = timeChipIndexes.includes(index);
          return (
            <Pressable
              key={chip.label}
              testID={`kyc-time-${index}`}
              onPress={() => toggleTimeChip(index)}
              style={{
                height: 40,
                paddingHorizontal: spacing[4],
                borderRadius: radius.sm,
                backgroundColor: active ? colors.brand.primary : colors.neutral[0],
                borderWidth: active ? 0 : 2,
                borderColor: colors.neutral[300],
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: active ? colors.neutral[0] : colors.neutral[500],
                  fontWeight: '600',
                }}
              >
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ color: colors.neutral[500], fontSize: typography.size.label }}>
        Ces créneaux s’appliquent à tous les jours actifs. Pas de calendrier mois.
      </Text>
    </>
  );
}

export function KycStepProfile() {
  const { colors, spacing, typography } = useTheme();
  const hasPortrait = useKycDraftStore((s) => s.hasPortrait);
  const bio = useKycDraftStore((s) => s.bio);
  const patch = useKycDraftStore((s) => s.patch);

  return (
    <>
      <View style={{ alignItems: 'center', gap: spacing[3] }}>
        <Pressable
          testID="kyc-portrait"
          onPress={() => patch({ hasPortrait: true })}
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: hasPortrait
              ? colors.brand.primary
              : colors.brand.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: hasPortrait ? colors.neutral[0] : colors.brand.primary,
              fontWeight: '700',
            }}
          >
            {hasPortrait ? 'OK' : 'Photo'}
          </Text>
        </Pressable>
        <Text
          style={{
            color: colors.brand.primary,
            fontSize: typography.size.caption,
            fontWeight: '700',
          }}
        >
          {hasPortrait ? 'Portrait ajouté' : 'Prendre une photo'}
        </Text>
      </View>
      <Input
        testID="kyc-bio"
        label="Présentation"
        value={bio}
        onChangeText={(value) => patch({ bio: value })}
        placeholder="Laveur mobile à Lyon, intérieur / extérieur."
        multiline
        helper="Optionnel. Visible par les clients après acceptation."
      />
    </>
  );
}
