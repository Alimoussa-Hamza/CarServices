import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import {
  DECLINE_REASONS,
  type DeclineReasonId,
} from '../../data/missions';
import { useTheme } from '../../theme/theme-provider';
import { Button } from '../ui/button';

export type DeclineSheetProps = {
  visible: boolean;
  reasonId: DeclineReasonId | null;
  otherText: string;
  canConfirm: boolean;
  loading?: boolean;
  onReason: (id: DeclineReasonId) => void;
  onOtherText: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeclineSheet({
  visible,
  reasonId,
  otherText,
  canConfirm,
  loading = false,
  onReason,
  onOtherText,
  onConfirm,
  onCancel,
}: DeclineSheetProps) {
  const { colors, radius, spacing, typography } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0B1F3399' }}>
        <View
          testID="decline-sheet"
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
              marginBottom: spacing[2],
            }}
          >
            Pourquoi refusez-vous cette mission ?
          </Text>
          <Text
            style={{
              color: colors.neutral[700],
              fontSize: typography.size.caption,
              marginBottom: spacing[5],
            }}
          >
            Cela nous aide à améliorer les propositions.
          </Text>
          {DECLINE_REASONS.map((item) => {
            const active = reasonId === item.id;
            return (
              <Pressable
                key={item.id}
                testID={`decline-reason-${item.id}`}
                onPress={() => onReason(item.id)}
                style={{
                  borderWidth: 2,
                  borderColor: active ? colors.brand.primary : colors.neutral[300],
                  backgroundColor: active ? colors.brand.primaryLight : colors.neutral[0],
                  borderRadius: radius.md,
                  padding: spacing[4],
                  marginBottom: spacing[3],
                }}
              >
                <Text
                  style={{
                    color: colors.neutral[900],
                    fontWeight: active ? '700' : '500',
                  }}
                >
                  {item.label}
                </Text>
                {item.id === 'other' && active ? (
                  <TextInput
                    testID="decline-other-text"
                    value={otherText}
                    onChangeText={onOtherText}
                    placeholder="Précisez (optionnel)"
                    placeholderTextColor={colors.neutral[500]}
                    style={{
                      marginTop: spacing[3],
                      backgroundColor: colors.neutral[100],
                      borderRadius: radius.sm,
                      paddingHorizontal: spacing[3],
                      minHeight: 36,
                      color: colors.neutral[900],
                    }}
                  />
                ) : null}
              </Pressable>
            );
          })}
          <Pressable
            testID="decline-confirm"
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
            <Text style={{ color: colors.neutral[0], fontWeight: '700' }}>
              Confirmer le refus
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
