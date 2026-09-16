import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';
import {
  createPlacesSessionToken,
  resolvePlace,
  searchPlaces,
  type PlaceSuggestion,
  type ResolvedPlace,
} from '../../data/places';
import { useTheme } from '../../theme/theme-provider';
import { Input } from '../ui/input';

export type AddressAutocompleteProps = {
  value: string;
  onChangeText: (text: string) => void;
  onPlaceResolved: (place: ResolvedPlace) => void;
  testID?: string;
};

const DEBOUNCE_MS = 300;

export function AddressAutocomplete({
  value,
  onChangeText,
  onPlaceResolved,
  testID = 'address-autocomplete',
}: AddressAutocompleteProps) {
  const { colors, spacing, typography, radius } = useTheme();
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef(createPlacesSessionToken());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipSearchRef = useRef(false);

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    const q = value.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const next = await searchPlaces(q, sessionRef.current);
          setSuggestions(next);
        } catch (err) {
          setSuggestions([]);
          setError(err instanceof Error ? err.message : 'Recherche impossible.');
        } finally {
          setLoading(false);
        }
      })();
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value]);

  const onSelect = async (suggestion: PlaceSuggestion) => {
    setLoading(true);
    setError(null);
    try {
      const place = await resolvePlace(suggestion.placeId, sessionRef.current);
      skipSearchRef.current = true;
      onChangeText(place.line1);
      setSuggestions([]);
      onPlaceResolved(place);
      sessionRef.current = createPlacesSessionToken();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Adresse introuvable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ gap: spacing[2] }} testID={testID}>
      <Input
        label="Adresse"
        value={value}
        onChangeText={onChangeText}
        placeholder="Commence à saisir (ex. République Lyon)"
        autoCorrect={false}
        testID={`${testID}-input`}
        helper="Suggestions Places (mock Lyon si pas de clé Google)"
      />
      {loading ? <ActivityIndicator color={colors.brand.primary} /> : null}
      {error ? (
        <Text style={{ color: colors.semantic.error, fontSize: typography.size.caption }}>
          {error}
        </Text>
      ) : null}
      {suggestions.length > 0 ? (
        <View
          style={{
            backgroundColor: colors.neutral[0],
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.neutral[300],
            overflow: 'hidden',
          }}
          testID={`${testID}-list`}
        >
          {suggestions.map((s) => (
            <Pressable
              key={s.placeId}
              testID={`${testID}-item-${s.placeId}`}
              onPress={() => void onSelect(s)}
              style={{
                paddingHorizontal: spacing[5],
                paddingVertical: spacing[4],
                borderBottomWidth: 1,
                borderBottomColor: colors.neutral[100],
              }}
            >
              <Text style={{ color: colors.neutral[900], fontWeight: '600' }}>
                {s.primaryText}
              </Text>
              {s.secondaryText ? (
                <Text
                  style={{
                    color: colors.neutral[500],
                    fontSize: typography.size.caption,
                    marginTop: spacing[2],
                  }}
                >
                  {s.secondaryText}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
