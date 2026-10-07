import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { api, buildQuery } from '../api/client';
import { useResource } from '../api/useResource';
import { useNetworkStatus } from '../api/network';
import { readCachedTasks, rememberTasks } from '../api/offlineCache';
import { useAppTheme } from '../theme';
import { Button, FilterChips, SearchBar } from '../components/Controls';
import { EmptyState, ErrorState, ListSkeleton, OfflineBanner } from '../components/States';
import { TaskRow } from '../components/TaskRow';

const TASK_STATUSES = ['Pending', 'In Progress', 'Completed'];
const TASK_PRIORITIES = ['Low', 'Medium', 'High'];

export function TasksScreen({ navigation }) {
  const theme = useAppTheme();
  const isOnline = useNetworkStatus();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  const query = buildQuery({ search, status, priority, sort: 'createdAt', limit: 100 });
  const tasks = useResource(() => api.get(`/tasks${query}`), [search, status, priority]);

  // Seed the list from the last successful load when a fetch cannot complete,
  // so an offline user still sees the tasks they were just looking at.
  useEffect(() => {
    if (tasks.data) rememberTasks(tasks.data.data);
  }, [tasks.data]);

  const cached = !tasks.data && tasks.error ? readCachedTasks() : null;
  const rows = tasks.data ? tasks.data.data : cached ? cached.tasks : [];

  async function patchTask(task, changes) {
    try {
      await api.put(`/tasks/${task.id}`, changes);
      tasks.reload();
    } catch (error) {
      Alert.alert('Could not update the task', error.message);
    }
  }

  function confirmDelete(task) {
    Alert.alert('Delete task', `"${task.name}" will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/tasks/${task.id}`);
            tasks.reload();
          } catch (error) {
            Alert.alert('Could not delete the task', error.message);
          }
        },
      },
    ]);
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <FlatList
        data={tasks.loading ? [] : rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshing={tasks.refreshing}
        onRefresh={tasks.refresh}
        ListHeaderComponent={
          <View style={styles.header}>
            <OfflineBanner visible={!isOnline} cachedAt={cached ? cached.cachedAt : null} />

            <SearchBar value={search} onChangeText={setSearch} placeholder="Search tasks" />
            <FilterChips options={TASK_STATUSES} value={status} onChange={setStatus} />
            <FilterChips options={TASK_PRIORITIES} value={priority} onChange={setPriority} />

            <Button label="New task" icon="add" onPress={() => navigation.navigate('TaskForm', {})} />
          </View>
        }
        ListEmptyComponent={
          tasks.loading ? (
            <ListSkeleton rows={4} />
          ) : tasks.error && !cached ? (
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
                  : 'Add a task to one of your projects and it will show up here.'
              }
              actionLabel={search || status || priority ? 'Clear filters' : 'New task'}
              onAction={
                search || status || priority
                  ? () => {
                      setSearch('');
                      setStatus('');
                      setPriority('');
                    }
                  : () => navigation.navigate('TaskForm', {})
              }
            />
          )
        }
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            showProject
            onToggleComplete={(task) =>
              patchTask(task, { status: task.status === 'Completed' ? 'Pending' : 'Completed' })
            }
            onStatusChange={(task, next) => patchTask(task, { status: next })}
            onPriorityChange={(task, next) => patchTask(task, { priority: next })}
            onEdit={(task) => navigation.navigate('TaskForm', { task, projectId: task.projectId })}
            onDelete={confirmDelete}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  listContent: { padding: 16, gap: 12, paddingBottom: 32 },
  header: { gap: 12, marginBottom: 4 },
});
