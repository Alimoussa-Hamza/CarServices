import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/theme-provider';
import { Button } from './button';

export type StickyCtaProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  caption?: string;
  testID?: string;
};

export function StickyCta({
  label,
  onPress,
  loading,
  disabled,
  caption,
  testID,
}: StickyCtaProps) {
  const { colors, spacing, typography } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: spacing[5],
        paddingTop: spacing[4],
        paddingBottom: Math.max(insets.bottom, spacing[4]),
        backgroundColor: colors.neutral[0],
        borderTopWidth: 1,
        borderTopColor: colors.neutral[300],
        gap: spacing[3],
      }}
    >
      {caption ? (
        <Text
          style={{
            textAlign: 'center',
            color: colors.neutral[700],
            fontSize: typography.size.caption,
            fontWeight: '600',
          }}
        >
          {caption}
        </Text>
      ) : null}
      <Button testID={testID} loading={loading} disabled={disabled} onPress={onPress}>
        {label}
      </Button>
    </View>
  );
}
