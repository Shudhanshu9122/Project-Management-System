import { useLayoutEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api, ApiError } from '../api/client';
import { useAppTheme } from '../theme';
import { Button, FilterChips, TextField } from '../components/Controls';
import { Notice } from '../components/States';
import { validateProjectForm } from '../validation';

const PROJECT_STATUSES = ['Not Started', 'In Progress', 'Completed'];

export function ProjectFormScreen({ route, navigation }) {
  const existingProject = route.params ? route.params.project : null;
  const isEdit = Boolean(existingProject);

  const theme = useAppTheme();

  const [values, setValues] = useState({
    name: existingProject ? existingProject.name : '',
    description: existingProject ? existingProject.description || '' : '',
    status: existingProject ? existingProject.status : 'Not Started',
    startDate: existingProject ? existingProject.startDate || '' : '',
    endDate: existingProject ? existingProject.endDate || '' : '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Edit project' : 'New project' });
  }, [navigation, isEdit]);

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit() {
    const validation = validateProjectForm(values);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      name: values.name.trim(),
      description: values.description.trim() === '' ? null : values.description.trim(),
      status: values.status,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
    };

    try {
      if (isEdit) await api.put(`/projects/${existingProject.id}`, payload);
      else await api.post('/projects', payload);

      navigation.goBack();
    } catch (error) {
      const fields = error instanceof ApiError ? error.fieldErrors() : {};
      if (Object.keys(fields).length > 0) setErrors(fields);
      else setFormError(error.message || 'Could not save the project.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {formError ? <Notice tone="danger" icon="alert-circle-outline">{formError}</Notice> : null}

        <TextField
          label="Project name"
          value={values.name}
          onChangeText={(value) => setField('name', value)}
          error={errors.name}
          required
          autoFocus={!isEdit}
          placeholder="Website Redesign"
        />

        <TextField
          label="Description"
          value={values.description}
          onChangeText={(value) => setField('description', value)}
          error={errors.description}
          hint="Optional"
          multiline
          numberOfLines={3}
          style={[styles.multiline, { color: theme.text }]}
          placeholder="What is this project about?"
        />

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.text }]}>Status</Text>
          <FilterChips
            options={PROJECT_STATUSES}
            value={values.status}
            onChange={(value) => setField('status', value || 'Not Started')}
          />
        </View>

        <TextField
          label="Start date"
          value={values.startDate}
          onChangeText={(value) => setField('startDate', value)}
          error={errors.startDate}
          hint="YYYY-MM-DD"
          placeholder="2026-08-03"
          autoCapitalize="none"
        />

        <TextField
          label="End date"
          value={values.endDate}
          onChangeText={(value) => setField('endDate', value)}
          error={errors.endDate}
          hint="YYYY-MM-DD"
          placeholder="2026-11-20"
          autoCapitalize="none"
        />

        <Button
          label={isEdit ? 'Save changes' : 'Create project'}
          onPress={handleSubmit}
          loading={saving}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600' },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
});
