import { Text, View } from 'react-native';
import type { HomeOffer } from '../../data/home-types';
import { formatDurationMinutes, formatPriceEur } from '../../lib/format';
import { useTheme } from '../../theme/theme-provider';
import { Card, CardTitle } from '../ui/card';

export type OfferCardProps = {
  offer: HomeOffer;
  onPress?: () => void;
  compact?: boolean;
  testID?: string;
};

export function OfferCard({ offer, onPress, compact, testID }: OfferCardProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <Card
      onPress={onPress}
      testID={testID}
      contentStyle={compact ? { flex: 1, minWidth: '46%' } : undefined}
    >
      <CardTitle>{offer.name}</CardTitle>
      <Text
        style={{
          marginTop: spacing[2],
          color: colors.neutral[700],
          fontSize: typography.size.caption,
        }}
        numberOfLines={2}
      >
        {offer.description}
      </Text>
      <View
        style={{
          marginTop: spacing[4],
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <Text style={{ color: colors.brand.primary, fontWeight: '700', fontSize: typography.size.body }}>
          {formatPriceEur(offer.priceCents)}
        </Text>
        <Text style={{ color: colors.neutral[500], fontSize: typography.size.label }}>
          {formatDurationMinutes(offer.durationMinutes)}
        </Text>
      </View>
    </Card>
  );
}
