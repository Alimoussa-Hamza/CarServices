import { Modal, Pressable, Text, View } from 'react-native';
import { useTheme } from '../../theme/theme-provider';
import { Button } from '../ui/button';
import type { ExecutionModel } from '../../data/missions';
import { MIN_AFTER_PHOTOS, MIN_BEFORE_PHOTOS } from '../../data/missions';

export type CompleteSheetProps = {
  visible: boolean;
  execution: ExecutionModel | null;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function CompleteSheet({
  visible,
  execution,
  loading = false,
  onConfirm,
  onCancel,
}: CompleteSheetProps) {
  const { colors, radius, spacing, typography } = useTheme();
  const before = execution?.beforeUris.length ?? 0;
  const after = execution?.afterUris.length ?? 0;
  const done = execution?.checklist.filter((item) => item.done).length ?? 0;
  const total = execution?.checklist.length ?? 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0B1F3399' }}>
        <View
          testID="complete-sheet"
          style={{
            backgroundColor: colors.neutral[0],
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: spacing[5],
            paddingTop: spacing[3],
            paddingBottom: spacing[7],
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 5,
              borderRadius: 99,
              backgroundColor: colors.neutral[300],
              marginBottom: spacing[5],
            }}
          />
          <Text
            style={{
              color: colors.neutral[900],
              fontSize: typography.size.title,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: spacing[2],
            }}
          >
            Terminer la prestation ?
          </Text>
          <Text
            style={{
              color: colors.neutral[700],
              fontSize: typography.size.caption,
              textAlign: 'center',
              marginBottom: spacing[5],
            }}
          >
            Vérifiez que toutes les photos et la checklist sont complètes avant de
            valider.
          </Text>
          <View
            style={{
              backgroundColor: colors.neutral[100],
              borderRadius: radius.md,
              padding: spacing[5],
              marginBottom: spacing[5],
              gap: spacing[3],
            }}
          >
            <Text style={{ color: colors.neutral[900], fontWeight: '600' }}>
              {before}/{MIN_BEFORE_PHOTOS} photos avant
            </Text>
            <Text style={{ color: colors.neutral[900], fontWeight: '600' }}>
              {after}/{MIN_AFTER_PHOTOS} photos après
            </Text>
            <Text style={{ color: colors.neutral[900], fontWeight: '600' }}>
              {done}/{total} tâches complétées
            </Text>
          </View>
          <Button testID="complete-confirm" loading={loading} onPress={onConfirm}>
            Confirmer et terminer
          </Button>
          <Pressable onPress={onCancel} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.neutral[700], fontWeight: '600' }}>
              Retour à la prestation
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
