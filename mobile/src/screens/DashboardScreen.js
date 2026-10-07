import { Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '../api/client';
import { useResource } from '../api/useResource';
import { useNetworkStatus } from '../api/network';
import { useAppTheme } from '../theme';
import { DonutChart, ProgressBar, Screen, SectionTitle, StatCard } from '../components/Layout';
import { ErrorState, ListSkeleton, OfflineBanner } from '../components/States';

const CHART_COLORS = {
  Completed: '#10b981',
  'In Progress': '#6366f1',
  Pending: '#f59e0b',
};

export function DashboardScreen({ navigation }) {
  const theme = useAppTheme();
  const isOnline = useNetworkStatus();

  const stats = useResource(() => api.get('/dashboard'), []);
  const recent = useResource(() => api.get('/projects?limit=5&sort=createdAt&order=desc'), []);

  const loading = stats.loading || recent.loading;
  const error = stats.error || recent.error;

  function reloadAll() {
    stats.reload();
    recent.reload();
  }

  return (
    <Screen refreshing={stats.refreshing || recent.refreshing} onRefresh={() => { stats.refresh(); recent.refresh(); }}>
      <OfflineBanner visible={!isOnline} />

      {loading ? (
        <ListSkeleton rows={5} />
      ) : error ? (
        <ErrorState
          title={error.isOffline ? 'You are offline' : 'Could not load the dashboard'}
          message={error.message}
          onRetry={reloadAll}
        />
      ) : (
        <>
          <View style={styles.statsGrid}>
            <StatCard icon="F" label="Total projects" value={stats.data.data.totalProjects} tone="info" />
            <StatCard icon="T" label="Total tasks" value={stats.data.data.totalTasks} tone="info" />
            <StatCard
              icon="C"
              label="Completed tasks"
              value={stats.data.data.completedTasks}
              tone="success"
            />
            <StatCard
              icon="P"
              label="Pending tasks"
              value={stats.data.data.pendingTasks}
              tone="warning"
            />
            <StatCard
              icon="I"
              label="Projects in progress"
              value={stats.data.data.projectsInProgress}
              tone="info"
            />
            <StatCard
              icon="O"
              label="Overdue tasks"
              value={stats.data.data.overdueTasks}
              tone="danger"
            />
          </View>

          <View>
            <SectionTitle>Task status</SectionTitle>
            {stats.data.data.totalTasks === 0 ? (
              <Text style={{ color: theme.textMuted }}>
                No tasks yet. Add one to a project to see the split.
              </Text>
            ) : (
              <DonutChart
                total={stats.data.data.totalTasks}
                caption="tasks"
                segments={[
                  { label: 'Completed', value: stats.data.data.completedTasks, color: CHART_COLORS.Completed },
                  { label: 'In Progress', value: stats.data.data.inProgressTasks, color: CHART_COLORS['In Progress'] },
                  { label: 'Pending', value: stats.data.data.pendingTasks, color: CHART_COLORS.Pending },
                ]}
              />
            )}
          </View>

          <View style={{ gap: 12 }}>
            <SectionTitle>Recent projects</SectionTitle>

            {recent.data.data.length === 0 ? (
              <Text style={{ color: theme.textMuted }}>No projects yet.</Text>
            ) : (
              recent.data.data.map((project) => (
                <Pressable
                  key={project.id}
                  style={[styles.projectRow, { borderColor: theme.border }]}
                  accessibilityRole="button"
                  onPress={() =>
                    navigation.navigate('ProjectDetail', { id: project.id, name: project.name })
                  }
                >
                  <Text style={[styles.projectName, { color: theme.text }]}>{project.name}</Text>
                  <ProgressBar completed={project.completedTaskCount} total={project.taskCount} />
                </Pressable>
              ))
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsGrid: { gap: 12 },
  projectRow: { gap: 8, paddingBottom: 12, borderBottomWidth: 1 },
  projectName: { fontSize: 15, fontWeight: '600' },
});
