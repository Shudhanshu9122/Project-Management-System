import { ActivityIndicator, ScrollView, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAppTheme } from '../theme';

export const STATUS_TONE = {
  'Not Started': 'neutral',
  'In Progress': 'info',
  Completed: 'success',
  Pending: 'warning',
};

export const PRIORITY_TONE = { Low: 'neutral', Medium: 'warning', High: 'danger' };

export function Card({ children, style }) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionTitle({ children, action }) {
  const theme = useAppTheme();

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{children}</Text>
      {action}
    </View>
  );
}

export function Badge({ label, tone = 'neutral' }) {
  const theme = useAppTheme();
  const palette = theme.tints[tone] || theme.tints.neutral;

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: palette.text }]} />
      <Text style={[styles.badgeLabel, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ completed = 0, total = 0, showLabel = true }) {
  const theme = useAppTheme();
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <View style={{ gap: 6 }}>
      <View
        style={[styles.progressTrack, { backgroundColor: theme.surfaceMuted }]}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: percent }}
      >
        <View style={[styles.progressBar, { width: `${percent}%`, backgroundColor: theme.brand.brand600 }]} />
      </View>

      {showLabel ? (
        <View style={styles.rowBetween}>
          <Text style={[styles.meta, { color: theme.textMuted }]}>
            {completed}/{total} tasks
          </Text>
          <Text style={[styles.meta, { color: theme.textMuted }]}>{percent}%</Text>
        </View>
      ) : null}
    </View>
  );
}

export function StatCard({ icon, label, value, tone = 'info' }) {
  const theme = useAppTheme();
  const palette = theme.tints[tone] || theme.tints.info;

  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: palette.bg }]}>
        <Text style={[styles.statIconText, { color: palette.text }]}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
        <Text style={[styles.meta, { color: theme.textMuted }]}>{label}</Text>
      </View>
    </Card>
  );
}

export function Screen({ children, refreshing, onRefresh, scroll = true }) {
  const theme = useAppTheme();

  const content = (
    <View style={[styles.screenInner, !scroll && { flex: 1 }]}>{children}</View>
  );

  if (!scroll) {
    return <View style={[styles.screen, { backgroundColor: theme.background }]}>{content}</View>;
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollInner}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={theme.brand.brand600}
            colors={[theme.brand.brand600]}
          />
        ) : undefined
      }
    >
      {content}
    </ScrollView>
  );
}

/** Three-segment task status chart drawn with react-native-svg. */
export function DonutChart({ segments, total, caption, size = 150 }) {
  const theme = useAppTheme();
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const centre = size / 2;

  let offset = 0;
  const visible = segments.filter((segment) => segment.value > 0);

  return (
    <View style={styles.donutRow}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={centre}
            cy={centre}
            r={radius}
            stroke={theme.surfaceMuted}
            strokeWidth={stroke}
            fill="none"
          />
          {visible.map((segment) => {
            const length = (segment.value / total) * circumference;
            const element = (
              <Circle
                key={segment.label}
                cx={centre}
                cy={centre}
                r={radius}
                stroke={segment.color}
                strokeWidth={stroke}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                fill="none"
                transform={`rotate(-90 ${centre} ${centre})`}
              />
            );
            offset += length;
            return element;
          })}
        </Svg>

        <View style={styles.donutCentre} pointerEvents="none">
          <Text style={[styles.statValue, { color: theme.text }]}>{total}</Text>
          <Text style={[styles.meta, { color: theme.textMuted }]}>{caption}</Text>
        </View>
      </View>

      <View style={{ flex: 1, gap: 10 }}>
        {segments.map((segment) => (
          <View key={segment.label} style={rowStyles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: segment.color }]} />
            <Text style={[styles.meta, { color: theme.textMuted, flex: 1 }]}>{segment.label}</Text>
            <Text style={[styles.legendValue, { color: theme.text }]}>{segment.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function InlineLoader({ label }) {
  const theme = useAppTheme();
  return (
    <View style={styles.loader}>
      <ActivityIndicator color={theme.brand.brand600} />
      {label ? <Text style={[styles.meta, { color: theme.textMuted }]}>{label}</Text> : null}
    </View>
  );
}

const rowStyles = StyleSheet.create({
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeLabel: { fontSize: 12, fontWeight: '600' },
  progressTrack: { height: 8, borderRadius: 999, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 999 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontSize: 12 },
  legendValue: { fontSize: 13, fontWeight: '600' },
  statCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statIconText: { fontSize: 18, fontWeight: '700' },
  statValue: { fontSize: 22, fontWeight: '700' },
  screen: { flex: 1 },
  scrollInner: { paddingBottom: 32 },
  screenInner: { padding: 16, gap: 16 },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donutCentre: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  loader: { paddingVertical: 28, alignItems: 'center', gap: 8 },
});
