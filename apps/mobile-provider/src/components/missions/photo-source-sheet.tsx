import { Modal, Pressable, Text, View } from 'react-native';
import { useTheme } from '../../theme/theme-provider';
import { Button } from '../ui/button';

export type PhotoSourceSheetProps = {
  visible: boolean;
  onCamera: () => void;
  onLibrary: () => void;
  onCancel: () => void;
};

export function PhotoSourceSheet({
  visible,
  onCamera,
  onLibrary,
  onCancel,
}: PhotoSourceSheetProps) {
  const { colors, radius, spacing, typography } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0B1F3399' }}>
        <View
          testID="photo-source-sheet"
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
              fontWeight: '700',
              fontSize: typography.size.body,
              textAlign: 'center',
              marginBottom: spacing[5],
            }}
          >
            Ajouter une photo
          </Text>
          <Pressable
            testID="photo-source-camera"
            onPress={onCamera}
            style={{
              minHeight: 52,
              borderRadius: radius.md,
              borderWidth: 2,
              borderColor: colors.neutral[300],
              padding: spacing[4],
              marginBottom: spacing[3],
            }}
          >
            <Text style={{ color: colors.neutral[900], fontWeight: '700' }}>
              Prendre une photo
            </Text>
            <Text style={{ color: colors.neutral[700], fontSize: typography.size.label }}>
              Utiliser l’appareil photo
            </Text>
          </Pressable>
          <Pressable
            testID="photo-source-library"
            onPress={onLibrary}
            style={{
              minHeight: 52,
              borderRadius: radius.md,
              borderWidth: 2,
              borderColor: colors.neutral[300],
              padding: spacing[4],
              marginBottom: spacing[3],
            }}
          >
            <Text style={{ color: colors.neutral[900], fontWeight: '700' }}>
              Choisir dans la galerie
            </Text>
            <Text style={{ color: colors.neutral[700], fontSize: typography.size.label }}>
              Photo déjà prise
            </Text>
          </Pressable>
          <Button variant="ghost" onPress={onCancel}>
            Annuler
          </Button>
        </View>
      </View>
    </Modal>
  );
}
