import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';

/** 44px minimum touch target for every control. */
const MIN_TOUCH = 44;

export function Button({ label, onPress, variant = 'primary', loading = false, disabled = false, icon }) {
  const theme = useAppTheme();
  const isDisabled = disabled || loading;

  const palette = {
    primary: { bg: theme.brand.brand600, text: '#ffffff', border: 'transparent' },
    secondary: { bg: theme.surface, text: theme.text, border: theme.borderStrong },
    ghost: { bg: 'transparent', text: theme.textMuted, border: 'transparent' },
    danger: { bg: theme.brand.red600, text: '#ffffff', border: 'transparent' },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={palette.text} /> : null}
      {icon && !loading ? <Ionicons name={icon} size={17} color={palette.text} /> : null}
      <Text style={[styles.buttonLabel, { color: palette.text }]}>{label}</Text>
    </Pressable>
  );
}

export function TextField({ label, value, onChangeText, error, hint, required, secure, autoFocus, ...rest }) {
  const theme = useAppTheme();
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.text }]}>
        {label}
        {required ? <Text style={{ color: theme.brand.red500 }}> *</Text> : null}
      </Text>

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.brand.red500 : theme.borderStrong,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && !revealed}
          autoFocus={autoFocus}
          placeholderTextColor={theme.textSubtle}
          accessibilityLabel={label}
          style={[styles.input, { color: theme.text }]}
          {...rest}
        />

        {secure ? (
          <Pressable
            onPress={() => setRevealed((current) => !current)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            hitSlop={10}
            style={styles.reveal}
          >
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={19}
              color={theme.textSubtle}
            />
          </Pressable>
        ) : null}
      </View>

      {hint && !error ? <Text style={[styles.hint, { color: theme.textSubtle }]}>{hint}</Text> : null}
      {error ? <Text style={[styles.error, { color: theme.tints.danger.text }]}>{error}</Text> : null}
    </View>
  );
}

export function SearchBar({ value, onChangeText, placeholder = 'Search' }) {
  const theme = useAppTheme();

  return (
    <View
      style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.borderStrong }]}
    >
      <Ionicons name="search" size={17} color={theme.textSubtle} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSubtle}
        accessibilityLabel="Search"
        style={[styles.searchInput, { color: theme.text }]}
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} accessibilityLabel="Clear search" hitSlop={10}>
          <Ionicons name="close-circle" size={18} color={theme.textSubtle} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function FilterChips({ options, value, onChange }) {
  const theme = useAppTheme();
  const all = ['', ...options];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsRow}
      keyboardShouldPersistTaps="handled"
    >
      {all.map((option) => {
        const active = value === option;
        const label = option === '' ? 'All' : option;

        return (
          <Pressable
            key={label}
            onPress={() => onChange(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              styles.chip,
              {
                backgroundColor: active ? theme.brand.brand600 : theme.surface,
                borderColor: active ? theme.brand.brand600 : theme.borderStrong,
              },
            ]}
          >
            <Text style={[styles.chipLabel, { color: active ? '#ffffff' : theme.textMuted }]}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonLabel: { fontSize: 15, fontWeight: '600' },
  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: '600' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: MIN_TOUCH,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 10 },
  reveal: { paddingLeft: 8, paddingVertical: 8 },
  hint: { fontSize: 12 },
  error: { fontSize: 12, fontWeight: '500' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: MIN_TOUCH,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 8 },
  chipsRow: { gap: 8, paddingVertical: 2 },
  chip: { paddingHorizontal: 14, minHeight: 36, justifyContent: 'center', borderWidth: 1, borderRadius: 999 },
  chipLabel: { fontSize: 13, fontWeight: '500' },
});
