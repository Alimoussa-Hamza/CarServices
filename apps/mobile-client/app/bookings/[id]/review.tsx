import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import type { ReviewTag } from '@carservice/shared-types';
import { Button } from '../../../src/components/ui/button';
import { ErrorBanner } from '../../../src/components/ui/error-banner';
import { Input } from '../../../src/components/ui/input';
import { ScreenBackButton } from '../../../src/components/ui/screen-back-button';
import { StickyCta } from '../../../src/components/ui/sticky-cta';
import { createReview } from '../../../src/data/reviews';
import { mapApiError } from '../../../src/lib/api-errors';
import { REVIEW_TAG_OPTIONS } from '../../../src/lib/review-eligibility';
import { useTheme } from '../../../src/theme/theme-provider';

function paramId(value: string | string[] | undefined): string {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value) && value[0]) {
    return value[0];
  }
  return '';
}

/** C11 Avis — CS-M11-S08 */
export default function BookingReviewScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const bookingId = paramId(params.id);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState<ReviewTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const stars = useMemo(() => [1, 2, 3, 4, 5] as const, []);

  const toggleTag = (tag: ReviewTag) => {
    setTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag].slice(0, 4),
    );
  };

  const onSubmit = async () => {
    setError(null);
    if (!bookingId) {
      setError('Réservation introuvable.');
      return;
    }
    if (rating < 1 || rating > 5) {
      setError('Choisis une note de 1 à 5.');
      return;
    }
    if (comment.trim().length > 1000) {
      setError('Commentaire trop long (1000 caractères max).');
      return;
    }

    setLoading(true);
    try {
      await createReview({
        bookingId,
        rating,
        comment: comment.trim() || undefined,
        tags,
      });
      setDone(true);
    } catch (err) {
      setError(mapApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Merci',
            headerBackVisible: false,
            headerLeft: () => <ScreenBackButton fallback="/(tabs)/bookings" />,
          }}
        />
        <View
          style={{
            flex: 1,
            padding: spacing[7],
            justifyContent: 'center',
            gap: spacing[4],
            backgroundColor: colors.neutral[100],
          }}
          testID="review-success"
        >
          <Text
            style={{
              fontSize: typography.size.display,
              fontWeight: '700',
              color: colors.brand.primary,
            }}
          >
            Merci !
          </Text>
          <Text style={{ fontSize: typography.size.title, fontWeight: '700', color: colors.neutral[900] }}>
            Avis envoyé
          </Text>
          <Text style={{ color: colors.neutral[700] }}>
            Ton retour aide la communauté et le professionnel.
          </Text>
          <Button testID="review-done-home" onPress={() => router.replace('/(tabs)')}>
            Retour à l’accueil
          </Button>
          <Button
            variant="secondary"
            testID="review-done-bookings"
            onPress={() => router.replace('/(tabs)/bookings')}
          >
            Mes réservations
          </Button>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Votre avis' }} />
      <View style={{ flex: 1, backgroundColor: colors.neutral[100] }}>
        <ScrollView
          contentContainerStyle={{ padding: spacing[5], gap: spacing[5], paddingBottom: 160 }}
          testID="review-form"
        >
          <Text
            style={{
              fontSize: typography.size.title,
              fontWeight: '700',
              color: colors.neutral[900],
            }}
          >
            Lavage terminé !
          </Text>
          <Text style={{ color: colors.neutral[700] }}>
            Note le professionnel (obligatoire). Commentaire et tags optionnels.
          </Text>

          {error ? <ErrorBanner message={error} /> : null}

          <View style={{ gap: spacing[3] }}>
            <Text style={{ fontWeight: '700', color: colors.neutral[900] }}>Note</Text>
            <View style={{ flexDirection: 'row', gap: spacing[3] }} testID="review-stars">
              {stars.map((value) => {
                const active = rating >= value;
                return (
                  <Pressable
                    key={value}
                    testID={`review-star-${value}`}
                    onPress={() => setRating(value)}
                    accessibilityRole="button"
                    accessibilityLabel={`Note ${value} sur 5`}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: radius.md,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: active ? colors.brand.primaryLight : colors.neutral[0],
                      borderWidth: 1,
                      borderColor: active ? colors.brand.primary : colors.neutral[300],
                    }}
                  >
                    <Text
                      style={{
                        fontSize: typography.size.title,
                        color: active ? colors.brand.primary : colors.neutral[500],
                        fontWeight: '700',
                      }}
                    >
                      ★
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Input
            label="Commentaire (optionnel)"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ minHeight: 100 }}
            testID="review-comment"
            placeholder="Très satisfait, voiture impeccable…"
          />

          <View style={{ gap: spacing[3] }}>
            <Text style={{ fontWeight: '700', color: colors.neutral[900] }}>Tags</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>
              {REVIEW_TAG_OPTIONS.map((opt) => {
                const selected = tags.includes(opt.value);
                return (
                  <Pressable
                    key={opt.value}
                    testID={`review-tag-${opt.value}`}
                    onPress={() => toggleTag(opt.value)}
                    style={{
                      paddingVertical: spacing[3],
                      paddingHorizontal: spacing[4],
                      borderRadius: radius.full,
                      borderWidth: 1,
                      borderColor: selected ? colors.brand.primary : colors.neutral[300],
                      backgroundColor: selected ? colors.brand.primaryLight : colors.neutral[0],
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? colors.brand.primary : colors.neutral[700],
                        fontWeight: selected ? '700' : '500',
                        fontSize: typography.size.caption,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <StickyCta
          testID="review-submit"
          label="Envoyer mon avis"
          loading={loading}
          disabled={rating < 1}
          onPress={() => void onSubmit()}
          caption="Tu pourras aussi le faire plus tard depuis Réservations"
        />
      </View>
    </>
  );
}
