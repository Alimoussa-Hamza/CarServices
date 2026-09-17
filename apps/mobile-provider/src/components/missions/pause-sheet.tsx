import { Modal, Pressable, Text, View } from 'react-native';
import type { PauseChoice } from '../../stores/missions-ui.store';
import { useTheme } from '../../theme/theme-provider';
import { Button } from '../ui/button';

const CHOICES: { id: PauseChoice; label: string }[] = [
  { id: '1h', label: '1 heure' },
  { id: 'today', label: "Aujourd'hui" },
  { id: 'manual', label: 'Jusqu’à réactivation manuelle' },
];

export type PauseSheetProps = {
  visible: boolean;
  choice: PauseChoice;
  onChoice: (choice: PauseChoice) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function PauseSheet({
  visible,
  choice,
  onChoice,
  onConfirm,
  onCancel,
}: PauseSheetProps) {
  const { colors, radius, spacing, typography } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0B1F3399' }}>
        <View
          testID="pause-sheet"
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
            Mettre vos missions en pause ?
          </Text>
          <Text
            style={{
              color: colors.neutral[700],
              fontSize: typography.size.caption,
              textAlign: 'center',
              marginBottom: spacing[5],
            }}
          >
            Vous ne recevrez plus de nouvelles propositions tant que vous êtes hors
            ligne.
          </Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing[3],
              justifyContent: 'center',
              marginBottom: spacing[5],
            }}
          >
            {CHOICES.map((item) => {
              const active = choice === item.id;
              return (
                <Pressable
                  key={item.id}
                  testID={`pause-choice-${item.id}`}
                  onPress={() => onChoice(item.id)}
                  style={{
                    height: 40,
                    paddingHorizontal: spacing[4],
                    borderRadius: radius.sm,
                    backgroundColor: active ? colors.brand.primary : colors.neutral[0],
                    borderWidth: active ? 0 : 2,
                    borderColor: colors.neutral[300],
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: active ? colors.neutral[0] : colors.neutral[500],
                      fontWeight: '600',
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Button testID="pause-confirm" onPress={onConfirm}>
            Confirmer la pause
          </Button>
          <Button variant="ghost" onPress={onCancel}>
            Annuler
          </Button>
        </View>
      </View>
    </Modal>
  );
}
