import { Modal, Pressable, Text, View } from 'react-native';
import {
  CANCEL_REASONS,
  type CancelReasonId,
} from '../../data/missions';
import { useTheme } from '../../theme/theme-provider';
import { Button } from '../ui/button';

export type CancelSheetProps = {
  visible: boolean;
  reasonId: CancelReasonId | null;
  canConfirm: boolean;
  loading?: boolean;
  onReason: (id: CancelReasonId) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function CancelSheet({
  visible,
  reasonId,
  canConfirm,
  loading = false,
  onReason,
  onConfirm,
  onCancel,
}: CancelSheetProps) {
  const { colors, radius, spacing, typography } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0B1F3399' }}>
        <View
          testID="cancel-sheet"
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
          <View
            style={{
              alignSelf: 'center',
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#FBF0DD',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing[3],
            }}
          >
            <Text style={{ fontSize: 18 }}>!</Text>
          </View>
          <Text
            style={{
              color: colors.neutral[900],
              fontSize: typography.size.title,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: spacing[2],
            }}
          >
            Annuler cette mission ?
          </Text>
          <Text
            style={{
              color: colors.neutral[700],
              fontSize: typography.size.caption,
              textAlign: 'center',
              marginBottom: spacing[5],
            }}
          >
            Merci d’indiquer un motif. Des annulations répétées peuvent affecter
            votre profil.
          </Text>
          {CANCEL_REASONS.map((item) => {
            const active = reasonId === item.id;
            return (
              <Pressable
                key={item.id}
                testID={`cancel-reason-${item.id}`}
                onPress={() => onReason(item.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing[3],
                  borderWidth: 2,
                  borderColor: active ? colors.brand.primary : colors.neutral[300],
                  backgroundColor: active ? colors.brand.primaryLight : colors.neutral[0],
                  borderRadius: radius.md,
                  padding: spacing[4],
                  marginBottom: spacing[3],
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: active ? colors.brand.primary : colors.neutral[300],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {active ? (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: colors.brand.primary,
                      }}
                    />
                  ) : null}
                </View>
                <Text
                  style={{
                    color: colors.neutral[900],
                    fontWeight: active ? '700' : '500',
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
          <Text
            style={{
              color: colors.neutral[700],
              fontSize: typography.size.label,
              textAlign: 'center',
              marginBottom: spacing[3],
            }}
          >
            Sélectionnez un motif pour continuer.
          </Text>
          <Pressable
            testID="cancel-confirm"
            disabled={!canConfirm || loading}
            onPress={onConfirm}
            style={{
              minHeight: 52,
              borderRadius: radius.md,
              backgroundColor:
                !canConfirm || loading ? colors.neutral[300] : colors.semantic.error,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing[2],
            }}
          >
            <Text
              style={{
                color: !canConfirm || loading ? colors.neutral[500] : colors.neutral[0],
                fontWeight: '700',
              }}
            >
              Confirmer l’annulation
            </Text>
          </Pressable>
          <Button variant="ghost" onPress={onCancel}>
            Retour
          </Button>
        </View>
      </View>
    </Modal>
  );
}
