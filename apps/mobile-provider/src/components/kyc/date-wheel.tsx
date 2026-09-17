import { Pressable, Text, View } from 'react-native';
import {
  daysInMonth,
  defaultFutureExpiry,
  expiryYearOptions,
  MONTHS_FR,
  parseIsoDate,
  toIsoDate,
} from '../../lib/kyc-validation';
import { useTheme } from '../../theme/theme-provider';

export type DateWheelProps = {
  value: string;
  onChange: (iso: string) => void;
  testID?: string;
};

function wheelSlice<T>(items: T[], selectedIndex: number, radius = 2): T[] {
  const start = Math.max(0, selectedIndex - radius);
  const end = Math.min(items.length, selectedIndex + radius + 1);
  return items.slice(start, end);
}

export function DateWheel({ value, onChange, testID }: DateWheelProps) {
  const { colors, radius, spacing, typography } = useTheme();
  const fallback = defaultFutureExpiry();
  const parsed = parseIsoDate(value) ?? fallback;
  const years = expiryYearOptions();
  const days = Array.from(
    { length: daysInMonth(parsed.year, parsed.month) },
    (_, index) => index + 1,
  );
  const months = MONTHS_FR.map((label, index) => ({
    label,
    month: index + 1,
  }));

  const selectedDayIndex = Math.max(0, days.indexOf(parsed.day));
  const selectedMonthIndex = parsed.month - 1;
  const selectedYearIndex = Math.max(0, years.indexOf(parsed.year));

  const commit = (next: { year: number; month: number; day: number }) => {
    onChange(toIsoDate(next.year, next.month, next.day));
  };

  return (
    <View
      testID={testID}
      style={{
        backgroundColor: colors.neutral[0],
        borderRadius: radius.lg,
        padding: spacing[5],
        gap: spacing[3],
      }}
    >
      <Text
        style={{
          color: colors.neutral[900],
          fontSize: typography.size.caption,
          fontWeight: '600',
        }}
      >
        Choisir la date
      </Text>
      <View style={{ flexDirection: 'row', minHeight: 140 }}>
        <WheelColumn
          items={wheelSlice(days, selectedDayIndex).map(String)}
          selected={String(parsed.day)}
          onSelect={(raw) =>
            commit({ ...parsed, day: Number(raw) })
          }
        />
        <WheelColumn
          items={wheelSlice(months, selectedMonthIndex).map((item) => item.label)}
          selected={MONTHS_FR[selectedMonthIndex] ?? 'Jan'}
          onSelect={(label) => {
            const month = months.find((item) => item.label === label)?.month ?? 1;
            commit({ ...parsed, month });
          }}
        />
        <WheelColumn
          items={wheelSlice(years, selectedYearIndex).map(String)}
          selected={String(parsed.year)}
          onSelect={(raw) => commit({ ...parsed, year: Number(raw) })}
        />
      </View>
    </View>
  );
}

function WheelColumn({
  items,
  selected,
  onSelect,
}: {
  items: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  const { colors, typography } = useTheme();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      {items.map((item) => {
        const isSelected = item === selected;
        return (
          <Pressable
            key={item}
            onPress={() => onSelect(item)}
            style={{ paddingVertical: 4 }}
          >
            <Text
              style={{
                color: isSelected ? colors.neutral[900] : colors.neutral[500],
                fontSize: isSelected ? typography.size.body : typography.size.caption,
                fontWeight: isSelected ? '700' : '500',
              }}
            >
              {item}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
