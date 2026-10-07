import { useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, ApiError } from '../api/client';
import { useResource } from '../api/useResource';
import { useAppTheme } from '../theme';
import { Button, FilterChips, TextField } from '../components/Controls';
import { Notice } from '../components/States';
import { OptionSheet } from '../components/OptionSheet';
import { validateTaskForm } from '../validation';

const TASK_PRIORITIES = ['Low', 'Medium', 'High'];
const TASK_STATUSES = ['Pending', 'In Progress', 'Completed'];

export function TaskFormScreen({ route, navigation }) {
  const existingTask = route.params ? route.params.task : null;
  const presetProjectId = route.params ? route.params.projectId : '';
  const isEdit = Boolean(existingTask);

  const theme = useAppTheme();
  const projects = useResource(() => api.get('/projects?limit=100&sort=name'), []);

  const [values, setValues] = useState({
    name: existingTask ? existingTask.name : '',
    description: existingTask ? existingTask.description || '' : '',
    projectId: existingTask ? existingTask.projectId : presetProjectId || '',
    priority: existingTask ? existingTask.priority : 'Medium',
    status: existingTask ? existingTask.status : 'Pending',
    dueDate: existingTask ? existingTask.dueDate || '' : '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [projectSheetOpen, setProjectSheetOpen] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Edit task' : 'New task' });
  }, [navigation, isEdit]);

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit() {
    const validation = validateTaskForm(values);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      projectId: values.projectId,
      name: values.name.trim(),
      description: values.description.trim() === '' ? null : values.description.trim(),
      priority: values.priority,
      status: values.status,
      dueDate: values.dueDate || null,
    };

    try {
      if (isEdit) await api.put(`/tasks/${existingTask.id}`, payload);
      else await api.post('/tasks', payload);

      navigation.goBack();
    } catch (error) {
      const fields = error instanceof ApiError ? error.fieldErrors() : {};
      if (Object.keys(fields).length > 0) setErrors(fields);
      else setFormError(error.message || 'Could not save the task.');
    } finally {
      setSaving(false);
    }
  }

  const projectList = projects.data ? projects.data.data : [];
  const selectedProject = projectList.find((project) => project.id === values.projectId);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {formError ? <Notice tone="danger" icon="alert-circle-outline">{formError}</Notice> : null}

        <TextField
          label="Task name"
          value={values.name}
          onChangeText={(value) => setField('name', value)}
          error={errors.name}
          required
          autoFocus={!isEdit}
          placeholder="Build component library"
        />

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.text }]}>
            Project<Text style={{ color: theme.brand.red500 }}> *</Text>
          </Text>

          {projects.loading ? (
            <ActivityIndicator color={theme.brand.brand600} />
          ) : (
            <Pressable
              onPress={() => setProjectSheetOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Choose a project"
              style={[
                styles.select,
                {
                  backgroundColor: theme.surface,
                  borderColor: errors.projectId ? theme.brand.red500 : theme.borderStrong,
                },
              ]}
            >
              <Text style={{ color: selectedProject ? theme.text : theme.textSubtle, flex: 1 }}>
                {selectedProject ? selectedProject.name : 'Select a project'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={theme.textSubtle} />
            </Pressable>
          )}

          {errors.projectId ? (
            <Text style={{ color: theme.tints.danger.text, fontSize: 12 }}>{errors.projectId}</Text>
          ) : null}
        </View>

        <TextField
          label="Description"
          value={values.description}
          onChangeText={(value) => setField('description', value)}
          error={errors.description}
          hint="Optional"
          multiline
          numberOfLines={3}
          style={[styles.multiline, { color: theme.text }]}
          placeholder="What needs to happen?"
        />

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.text }]}>Priority</Text>
          <FilterChips options={TASK_PRIORITIES} value={values.priority} onChange={(value) => setField('priority', value || 'Medium')} />
        </View>

        {isEdit ? (
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.text }]}>Status</Text>
            <FilterChips options={TASK_STATUSES} value={values.status} onChange={(value) => setField('status', value || 'Pending')} />
          </View>
        ) : null}

        <TextField
          label="Due date"
          value={values.dueDate}
          onChangeText={(value) => setField('dueDate', value)}
          error={errors.dueDate}
          hint="YYYY-MM-DD, leave empty for no due date"
          placeholder="2026-11-16"
          keyboardType={Platform.OS === 'android' ? 'numbers-and-punctuation' : 'numbers-and-punctuation'}
          autoCapitalize="none"
        />

        <Button
          label={isEdit ? 'Save changes' : 'Create task'}
          onPress={handleSubmit}
          loading={saving}
          disabled={projectList.length === 0}
        />

        {projectList.length === 0 ? (
          <Notice tone="warning" icon="alert-circle-outline">
            Create a project first - every task belongs to one.
          </Notice>
        ) : null}
      </ScrollView>

      <OptionSheet
        visible={projectSheetOpen}
        title="Project"
        options={projectList.map((project) => project.name)}
        value={selectedProject ? selectedProject.name : ''}
        onSelect={(name) => {
          const match = projectList.find((project) => project.name === name);
          if (match) setField('projectId', match.id);
          setProjectSheetOpen(false);
        }}
        onClose={() => setProjectSheetOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600' },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
});
