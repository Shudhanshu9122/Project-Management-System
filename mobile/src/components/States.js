import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import { Button } from './Controls';
import { Card as Surface } from './Layout';

export function Loading({ label = 'Loading' }) {
  const theme = useAppTheme();

  return (
    <View style={styles.centered} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator size="large" color={theme.brand.brand600} />
      <Text style={[styles.text, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

/** Grey placeholder rows shown while a list loads for the first time. */
export function ListSkeleton({ rows = 4 }) {
  const theme = useAppTheme();

  return (
    <Surface style={{ padding: 0 }}>
      {Array.from({ length: rows }, (_, index) => (
        <View key={index} style={[styles.skeletonRow, { borderBottomColor: theme.border }]}>
          <View style={[styles.skeletonBox, { backgroundColor: theme.surfaceMuted }]} />
          <View style={{ flex: 1, gap: 8 }}>
            <View
              style={[styles.skeletonLine, { backgroundColor: theme.surfaceMuted, width: '55%' }]}
            />
            <View
              style={[styles.skeletonLine, { backgroundColor: theme.surfaceMuted, width: '32%' }]}
            />
          </View>
        </View>
      ))}
    </Surface>
  );
}

export function EmptyState({ icon = 'file-tray-outline', title, message, actionLabel, onAction }) {
  const theme = useAppTheme();

  return (
    <View style={styles.centered}>
      <View style={[styles.iconCircle, { backgroundColor: theme.surfaceMuted }]}>
        <Ionicons name={icon} size={26} color={theme.textSubtle} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {message ? <Text style={[styles.text, { color: theme.textMuted }]}>{message}</Text> : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry, title = 'Something went wrong' }) {
  const theme = useAppTheme();

  return (
    <View style={styles.centered}>
      <View style={[styles.iconCircle, { backgroundColor: theme.tints.danger.bg }]}>
        <Ionicons name="alert-circle-outline" size={26} color={theme.tints.danger.text} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {message ? <Text style={[styles.text, { color: theme.textMuted }]}>{message}</Text> : null}
      {onRetry ? <Button label="Retry" variant="secondary" icon="refresh" onPress={onRetry} /> : null}
    </View>
  );
}

export function OfflineBanner({ visible, cachedAt }) {
  const theme = useAppTheme();

  if (!visible) return null;

  return (
    <View
      style={[styles.banner, { backgroundColor: theme.tints.warning.bg }]}
      accessibilityRole="alert"
    >
      <Ionicons name="cloud-offline-outline" size={17} color={theme.tints.warning.text} />
      <Text style={[styles.bannerText, { color: theme.tints.warning.text }]}>
        You are offline. Changes will not be saved.
        {cachedAt ? ` Showing data from ${cachedAt.toLocaleTimeString()}.` : ''}
      </Text>
    </View>
  );
}

export function Notice({ tone = 'info', icon = 'information-circle-outline', children }) {
  const theme = useAppTheme();
  const palette = theme.tints[tone] || theme.tints.info;

  return (
    <View style={[styles.banner, { backgroundColor: palette.bg }]} accessibilityRole="alert">
      <Ionicons name={icon} size={17} color={palette.text} />
      <Text style={[styles.bannerText, { color: palette.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 40 },
  text: { fontSize: 14, textAlign: 'center', maxWidth: 320 },
  title: { fontSize: 17, fontWeight: '600' },
  iconCircle: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
  },
  bannerText: { flex: 1, fontSize: 13, fontWeight: '500' },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
  },
  skeletonBox: { width: 22, height: 22, borderRadius: 6 },
  skeletonLine: { height: 12, borderRadius: 6 },
});
