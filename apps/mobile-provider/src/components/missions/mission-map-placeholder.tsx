import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/theme-provider';

export function MissionMapPlaceholder({
  onOpenMaps,
}: {
  onOpenMaps: () => void;
}) {
  const { colors, spacing } = useTheme();

  return (
    <View
      testID="mission-map"
      style={{
        height: 330,
        backgroundColor: '#EAF0EC',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: '25%',
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: 'rgba(255,255,255,0.7)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: '60%',
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: 'rgba(255,255,255,0.7)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: '30%',
          top: 0,
          bottom: 0,
          width: 1,
          backgroundColor: 'rgba(255,255,255,0.7)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: '70%',
          top: 0,
          bottom: 0,
          width: 1,
          backgroundColor: 'rgba(255,255,255,0.7)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          marginLeft: -14,
          marginTop: -28,
        }}
      >
        <Ionicons name="location" size={36} color={colors.semantic.error} />
      </View>
      <Pressable
        testID="mission-open-maps"
        onPress={onOpenMaps}
        style={{
          position: 'absolute',
          top: spacing[3],
          right: spacing[3],
          backgroundColor: colors.neutral[0],
          borderRadius: 99,
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[2],
          minHeight: 44,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Ionicons name="navigate" size={14} color={colors.brand.primary} />
        <Text style={{ color: colors.neutral[900], fontSize: 12, fontWeight: '600' }}>
          Ouvrir dans Maps
        </Text>
      </Pressable>
    </View>
  );
}
