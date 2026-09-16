import { Text, View } from 'react-native';
import type { HomeBookingSummary } from '../../data/home-types';
import { formatBookingStatus } from '../../lib/booking-status';
import { formatPriceEur, formatSlotFr } from '../../lib/format';
import { useTheme } from '../../theme/theme-provider';
import { Badge } from '../ui/badge';
import { Card, CardTitle } from '../ui/card';

const CANCELLED_STATUSES = new Set([
  'cancelled_by_client',
  'cancelled_by_provider',
  'cancelled_by_admin',
  'expired',
  'unassigned',
]);

export type NextBookingCardProps = {
  booking: HomeBookingSummary;
  onPress?: () => void;
  testID?: string;
};

export function NextBookingCard({ booking, onPress, testID }: NextBookingCardProps) {
  const { colors, spacing, typography } = useTheme();
  const cancelled = CANCELLED_STATUSES.has(booking.status);

  return (
    <Card
      onPress={onPress}
      testID={testID}
      contentStyle={{
        borderLeftWidth: 4,
        borderLeftColor: cancelled ? colors.semantic.warning : colors.brand.primary,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing[3] }}>
        <CardTitle>{booking.offerName}</CardTitle>
        <Text style={{ color: colors.brand.primary, fontWeight: '700' }}>
          {formatPriceEur(booking.totalCents)}
        </Text>
      </View>
      <Text
        style={{
          marginTop: spacing[2],
          color: colors.neutral[700],
          fontSize: typography.size.caption,
        }}
      >
        {formatSlotFr(booking.scheduledAt)} · {booking.reference}
      </Text>
      <View style={{ marginTop: spacing[3] }}>
        <Badge
          label={formatBookingStatus(booking.status)}
          tone={cancelled ? 'warning' : 'success'}
        />
      </View>
    </Card>
  );
}
