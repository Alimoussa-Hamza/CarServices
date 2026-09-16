import { Text, View } from 'react-native';
import { Button } from './button';
import { useTheme } from '../../theme/theme-provider';

export type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  testID,
}: EmptyStateProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <View
      testID={testID}
      style={{
        alignItems: 'center',
        paddingVertical: spacing[8],
        paddingHorizontal: spacing[5],
        gap: spacing[3],
      }}
    >
      <Text
        style={{
          color: colors.neutral[900],
          fontSize: typography.size.body,
          fontWeight: '700',
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      {description ? (
        <Text
          style={{
            color: colors.neutral[700],
            fontSize: typography.size.caption,
            textAlign: 'center',
          }}
        >
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: spacing[3], width: '100%' }}>
          <Button onPress={onAction}>{actionLabel}</Button>
        </View>
      ) : null}
    </View>
  );
}
