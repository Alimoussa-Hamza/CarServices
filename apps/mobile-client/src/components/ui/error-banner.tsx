import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/theme-provider';

export type ErrorBannerProps = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
};

export function ErrorBanner({
  message,
  actionLabel = 'Réessayer',
  onAction,
  testID,
}: ErrorBannerProps) {
  const { colors, radius, spacing, typography } = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: colors.neutral[0],
          borderColor: colors.semantic.error,
          borderRadius: radius.md,
          padding: spacing[5],
        },
      ]}
    >
      <Text
        style={{
          color: colors.neutral[900],
          fontSize: typography.size.body,
          lineHeight: typography.lineHeight.body,
          flex: 1,
        }}
      >
        {message}
      </Text>
      {onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          testID={testID ? `${testID}-action` : undefined}
          style={{ marginTop: spacing[3] }}
        >
          <Text
            style={{
              color: colors.brand.primary,
              fontWeight: '600',
              fontSize: typography.size.caption,
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
});
