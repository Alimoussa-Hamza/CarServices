import type { ReactNode } from 'react';
import { Pressable, Text, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme/theme-provider';

export type CardProps = Omit<PressableProps, 'children'> & {
  children: ReactNode;
  testID?: string;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Card({ children, testID, style, contentStyle, onPress, ...rest }: CardProps) {
  const { colors, radius, spacing } = useTheme();

  const base: ViewStyle = {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.md,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.neutral[300],
  };

  if (!onPress) {
    return (
      <View testID={testID} style={[base, contentStyle, typeof style === 'object' ? style : null]}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={(state) => [
        base,
        contentStyle,
        { opacity: state.pressed ? 0.9 : 1 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

export function CardTitle({ children }: { children: string }) {
  const { colors, typography } = useTheme();
  return (
    <Text
      style={{
        color: colors.neutral[900],
        fontSize: typography.size.body,
        fontWeight: '700',
      }}
    >
      {children}
    </Text>
  );
}
