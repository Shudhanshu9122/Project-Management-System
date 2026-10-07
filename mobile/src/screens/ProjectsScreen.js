import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { api, buildQuery } from '../api/client';
import { useResource } from '../api/useResource';
import { useNetworkStatus } from '../api/network';
import { useAppTheme } from '../theme';
import { Badge, Card, ProgressBar, STATUS_TONE } from '../components/Layout';
import { Button, FilterChips, SearchBar } from '../components/Controls';
import { EmptyState, ErrorState, ListSkeleton, OfflineBanner } from '../components/States';

const PROJECT_STATUSES = ['Not Started', 'In Progress', 'Completed'];

export function ProjectsScreen({ navigation }) {
  const theme = useAppTheme();
  const isOnline = useNetworkStatus();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const query = buildQuery({ search, status, sort: 'name', limit: 100 });
  const projects = useResource(() => api.get(`/projects${query}`), [search, status]);

  async function handleDelete(project) {
    try {
      await api.delete(`/projects/${project.id}`);
      projects.reload();
    } catch (error) {
      Alert.alert('Could not delete the project', error.message);
    }
  }

  function confirmDelete(project) {
    Alert.alert(
      'Delete project',
      `"${project.name}" and its ${project.taskCount} task(s) will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDelete(project) },
      ]
    );
  }

  const rows = projects.data ? projects.data.data : [];

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <FlatList
        data={projects.loading ? [] : rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshing={projects.refreshing}
        onRefresh={projects.refresh}
        ListHeaderComponent={
          <View style={styles.header}>
            <OfflineBanner visible={!isOnline} />

            <SearchBar value={search} onChangeText={setSearch} placeholder="Search projects" />
            <FilterChips options={PROJECT_STATUSES} value={status} onChange={setStatus} />

            <Button
              label="New project"
              icon="add"
              onPress={() => navigation.navigate('ProjectForm', {})}
            />
          </View>
        }
        ListEmptyComponent={
          projects.loading ? (
            <ListSkeleton rows={3} />
          ) : projects.error ? (
            <ErrorState
              title={projects.error.isOffline ? 'You are offline' : 'Could not load projects'}
              message={projects.error.message}
              onRetry={projects.reload}
            />
          ) : (
            <EmptyState
              icon="folder-open-outline"
              title={search || status ? 'No projects match those filters' : 'No projects yet'}
              message={
                search || status
                  ? 'Try a different search term or clear the filter.'
                  : 'Create a project to start tracking tasks.'
              }
              actionLabel={search || status ? 'Clear filters' : 'New project'}
              onAction={
                search || status
                  ? () => {
                      setSearch('');
                      setStatus('');
                    }
                  : () => navigation.navigate('ProjectForm', {})
              }
            />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('ProjectDetail', { id: item.id, name: item.name })}
            onLongPress={() => confirmDelete(item)}
            accessibilityRole="button"
            accessibilityLabel={`${item.name}. Tap to open, long press for more options.`}
          >
            <Card style={{ gap: 10 }}>
              <View style={styles.rowBetween}>
                <Text style={[styles.title, { color: theme.text, flex: 1 }]} numberOfLines={2}>
                  {item.name}
                </Text>
                <Badge label={item.status} tone={STATUS_TONE[item.status]} />
              </View>

              {item.description ? (
                <Text style={{ color: theme.textMuted, fontSize: 13 }} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}

              <Text style={{ color: theme.textSubtle, fontSize: 12 }}>
                {item.startDate || item.endDate
                  ? `${item.startDate || 'No start'} - ${item.endDate || 'No end'}`
                  : 'No dates set'}
              </Text>

              <ProgressBar completed={item.completedTaskCount} total={item.taskCount} />
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  listContent: { padding: 16, gap: 12, paddingBottom: 32 },
  header: { gap: 12, marginBottom: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { fontSize: 16, fontWeight: '700' },
});
