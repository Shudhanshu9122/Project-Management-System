import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';

/**
 * Small bottom sheet used to change a status or a priority in one tap without
 * leaving the list. A native ActionSheet would be a closer fit but is not
 * available on Android in the same shape.
 */
export function OptionSheet({ visible, title, options, value, onSelect, onClose }) {
  const theme = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={styles.sheetWrapper} pointerEvents="box-none">
        <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.textMuted }]}>{title}</Text>

          {options.map((option) => {
            const selected = option === value;

            return (
              <Pressable
                key={option}
                onPress={() => onSelect(option)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={styles.option}
              >
                <Text style={[styles.optionLabel, { color: selected ? theme.brand.brand600 : theme.text }]}>
                  {option}
                </Text>
                {selected ? (
                  <Ionicons name="checkmark" size={19} color={theme.brand.brand600} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(9, 12, 22, 0.45)' },
  sheetWrapper: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingTop: 14,
    paddingBottom: 24,
    paddingHorizontal: 8,
  },
  title: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', paddingHorizontal: 12, marginBottom: 6 },
  option: {
    minHeight: 52,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLabel: { fontSize: 16 },
});
