import { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { api, buildQuery } from '../api/client';
import { useResource } from '../api/useResource';
import { useNetworkStatus } from '../api/network';
import { useAppTheme } from '../theme';
import { Badge, Card, ProgressBar, STATUS_TONE } from '../components/Layout';
import { Button, FilterChips, SearchBar } from '../components/Controls';
import { EmptyState, ErrorState, ListSkeleton, OfflineBanner } from '../components/States';
import { TaskRow } from '../components/TaskRow';

const TASK_STATUSES = ['Pending', 'In Progress', 'Completed'];
const TASK_PRIORITIES = ['Low', 'Medium', 'High'];

export function ProjectDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const theme = useAppTheme();
  const isOnline = useNetworkStatus();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  const project = useResource(() => api.get(`/projects/${id}`), [id]);

  const query = buildQuery({ projectId: id, search, status, priority, sort: 'createdAt', limit: 100 });
  const tasks = useResource(() => api.get(`/tasks${query}`), [id, search, status, priority]);

  // The header shows the live project name once it has loaded.
  useLayoutEffect(() => {
    if (project.data) navigation.setOptions({ title: project.data.data.name });
  }, [navigation, project.data]);

  const reloadAll = useCallback(() => {
    project.reload();
    tasks.reload();
  }, [project.reload, tasks.reload]);

  async function patchTask(task, changes) {
    try {
      await api.put(`/tasks/${task.id}`, changes);
      reloadAll();
    } catch (error) {
      Alert.alert('Could not update the task', error.message);
    }
  }

  function confirmDeleteTask(task) {
    Alert.alert('Delete task', `"${task.name}" will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/tasks/${task.id}`);
            reloadAll();
          } catch (error) {
            Alert.alert('Could not delete the task', error.message);
          }
        },
      },
    ]);
  }

  const rows = tasks.data ? tasks.data.data : [];

  if (project.loading) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.background, padding: 16 }]}>
        <ListSkeleton rows={5} />
      </View>
    );
  }

  if (project.error) {
    const offline = project.error.isOffline;

    return (
      <View style={[styles.screen, { backgroundColor: theme.background, padding: 16 }]}>
        <ErrorState
          title={offline ? 'You are offline' : 'Could not load the project'}
          message={project.error.message}
          onRetry={reloadAll}
        />
      </View>
    );
  }

  const data = project.data.data;

  return (
    <FlatList
      style={[styles.screen, { backgroundColor: theme.background }]}
      data={tasks.loading ? [] : rows}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      refreshing={tasks.refreshing}
      onRefresh={reloadAll}
      ListHeaderComponent={
        <View style={styles.header}>
          <OfflineBanner visible={!isOnline} />

          <Card style={{ gap: 12 }}>
            <View style={styles.rowBetween}>
              <Text style={[styles.projectName, { color: theme.text, flex: 1 }]}>{data.name}</Text>
              <Badge label={data.status} tone={STATUS_TONE[data.status]} />
            </View>

            {data.description ? (
              <Text style={{ color: theme.textMuted, fontSize: 13 }}>{data.description}</Text>
            ) : null}

            <Text style={{ color: theme.textSubtle, fontSize: 12 }}>
              {data.startDate || data.endDate
                ? `${data.startDate || 'No start'} - ${data.endDate || 'No end'}`
                : 'No dates set'}
            </Text>

            <ProgressBar completed={data.completedTaskCount} total={data.taskCount} />

            <View style={styles.actions}>
              <Button
                label="Edit"
                variant="secondary"
                icon="create-outline"
                onPress={() => navigation.navigate('ProjectForm', { project: data })}
              />
              <Button
                label="Add task"
                icon="add"
                onPress={() => navigation.navigate('TaskForm', { projectId: data.id })}
              />
            </View>
          </Card>

          <SearchBar value={search} onChangeText={setSearch} placeholder="Search tasks" />
          <FilterChips options={TASK_STATUSES} value={status} onChange={setStatus} />
          <FilterChips options={TASK_PRIORITIES} value={priority} onChange={setPriority} />
        </View>
      }
      ListEmptyComponent={
        tasks.loading ? (
          <ListSkeleton rows={3} />
        ) : tasks.error ? (
          <ErrorState
            title={tasks.error.isOffline ? 'You are offline' : 'Could not load tasks'}
            message={tasks.error.message}
            onRetry={tasks.reload}
          />
        ) : (
          <EmptyState
            icon="checkbox-outline"
            title={search || status || priority ? 'No tasks match those filters' : 'No tasks yet'}
            message={
              search || status || priority
                ? 'Try a different search term or clear a filter.'
                : 'Add the first task to start tracking progress.'
            }
            actionLabel={search || status || priority ? 'Clear filters' : 'Add task'}
            onAction={
              search || status || priority
                ? () => {
                    setSearch('');
                    setStatus('');
                    setPriority('');
                  }
                : () => navigation.navigate('TaskForm', { projectId: data.id })
            }
          />
        )
      }
      renderItem={({ item }) => (
        <TaskRow
          task={item}
          onToggleComplete={(task) =>
            patchTask(task, { status: task.status === 'Completed' ? 'Pending' : 'Completed' })
          }
          onStatusChange={(task, next) => patchTask(task, { status: next })}
          onPriorityChange={(task, next) => patchTask(task, { priority: next })}
          onEdit={(task) => navigation.navigate('TaskForm', { task, projectId: data.id })}
          onDelete={confirmDeleteTask}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  listContent: { padding: 16, gap: 12, paddingBottom: 32 },
  header: { gap: 12, marginBottom: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  projectName: { fontSize: 19, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10 },
});
