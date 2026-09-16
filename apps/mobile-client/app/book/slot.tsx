import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { BookingStepper } from '../../src/components/booking/booking-stepper';
import { ErrorBanner } from '../../src/components/ui/error-banner';
import { StickyCta } from '../../src/components/ui/sticky-cta';
import { fetchSlots } from '../../src/data/slots';
import { formatSlotFr } from '../../src/lib/format';
import { mapApiError } from '../../src/lib/api-errors';
import { useBookingDraftStore } from '../../src/stores/booking-draft.store';
import { useTheme } from '../../src/theme/theme-provider';
import type { SlotPickerDay } from '@carservice/shared-types';

/** C07 Créneau — CS-M11-S04 */
export default function SlotScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const offerId = useBookingDraftStore((s) => s.offerId);
  const vehicleType = useBookingDraftStore((s) => s.vehicleType);
  const optionIds = useBookingDraftStore((s) => s.optionIds);
  const addressId = useBookingDraftStore((s) => s.address?.addressId);
  const slotStart = useBookingDraftStore((s) => s.slotStart);
  const setSlot = useBookingDraftStore((s) => s.setSlot);

  const [days, setDays] = useState<SlotPickerDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!offerId || !addressId) {
      router.replace('/book/catalog');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSlots({
        offerId,
        vehicleType,
        optionIds,
        addressId,
      });
      setDays(res.days);
    } catch (err) {
      setError(mapApiError(err));
    } finally {
      setLoading(false);
    }
  }, [offerId, addressId, vehicleType, optionIds]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral[100] }}>
      <BookingStepper current={3} />
      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[5], paddingBottom: 140 }}>
        {error ? <ErrorBanner message={error} onAction={() => void load()} /> : null}
        {loading ? <ActivityIndicator color={colors.brand.primary} /> : null}
        {!loading
          ? days.map((day) => (
              <View key={day.date} style={{ gap: spacing[3] }}>
                <Text style={{ fontWeight: '700', color: colors.neutral[900] }}>{day.date}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>
                  {day.slots.map((slot) => {
                    const selected = slotStart === slot.start;
                    const disabled = !slot.available;
                    return (
                      <Pressable
                        key={slot.start}
                        disabled={disabled}
                        testID={`slot-${slot.start}`}
                        onPress={() => setSlot(slot.start, slot.end)}
                        style={{
                          paddingVertical: spacing[3],
                          paddingHorizontal: spacing[4],
                          borderRadius: radius.md,
                          borderWidth: 1,
                          opacity: disabled ? 0.4 : 1,
                          borderColor: selected ? colors.brand.primary : colors.neutral[300],
                          backgroundColor: selected
                            ? colors.brand.primaryLight
                            : colors.neutral[0],
                        }}
                      >
                        <Text
                          style={{
                            color: colors.neutral[900],
                            fontSize: typography.size.caption,
                            fontWeight: selected ? '700' : '500',
                          }}
                        >
                          {formatSlotFr(slot.start)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))
          : null}
      </ScrollView>
      <StickyCta
        testID="slot-continue"
        label="Continuer vers le paiement"
        disabled={!slotStart}
        onPress={() => router.push('/book/pay')}
      />
    </View>
  );
}
