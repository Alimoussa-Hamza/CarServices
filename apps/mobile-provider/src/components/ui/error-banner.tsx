import { Text, View } from 'react-native';
import { useTheme } from '../../theme/theme-provider';

export type ErrorBannerProps = {
  message: string;
  testID?: string;
};

export function ErrorBanner({ message, testID }: ErrorBannerProps) {
  const { colors, radius, spacing, typography } = useTheme();

  return (
    <View
      testID={testID}
      style={{
        backgroundColor: colors.neutral[0],
        borderColor: colors.semantic.error,
        borderWidth: 1,
        borderRadius: radius.md,
        padding: spacing[5],
      }}
    >
      <Text
        style={{
          color: colors.semantic.error,
          fontSize: typography.size.body,
          fontWeight: '600',
        }}
      >
        {message}
      </Text>
    </View>
  );
}
