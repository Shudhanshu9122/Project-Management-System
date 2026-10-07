import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { FormField } from './FormField';
import { Spinner } from './Spinner';
import { TASK_PRIORITIES, TASK_STATUSES } from '../constants';
import { validateTaskForm } from '../validation';
import { api, ApiError } from '../api/client';
import { useToast } from '../context/ToastContext';

const FORM_ID = 'task-form';

export function TaskForm({ open, task, projects, defaultProjectId = '', onClose, onSaved }) {
  const [values, setValues] = useState({
    name: '',
    description: '',
    projectId: defaultProjectId,
    priority: 'Medium',
    status: 'Pending',
    dueDate: '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const isEdit = Boolean(task);

  useEffect(() => {
    if (!open) return;

    setValues(
      task
        ? {
            name: task.name,
            description: task.description || '',
            projectId: task.projectId,
            priority: task.priority,
            status: task.status,
            dueDate: task.dueDate || '',
          }
        : {
            name: '',
            description: '',
            projectId: defaultProjectId,
            priority: 'Medium',
            status: 'Pending',
            dueDate: '',
          }
    );
    setErrors({});
    setFormError(null);
  }, [open, task, defaultProjectId]);

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validation = validateTaskForm(values);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setSaving(true);
    setFormError(null);

    // projectId is included on edit so a task can be moved between projects.
    const payload = {
      projectId: values.projectId,
      name: values.name.trim(),
      description: values.description.trim() === '' ? null : values.description.trim(),
      priority: values.priority,
      status: values.status,
      dueDate: values.dueDate || null,
    };

    try {
      const response = isEdit
        ? await api.put(`/tasks/${task.id}`, payload)
        : await api.post('/tasks', payload);

      toast.success(isEdit ? 'Task updated' : 'Task created', response.data.name);
      onSaved(response.data);
      onClose();
    } catch (error) {
      const fields = error instanceof ApiError ? error.fieldErrors() : {};
      if (Object.keys(fields).length > 0) setErrors(fields);
      else setFormError(error.message || 'Could not save the task.');
    } finally {
      setSaving(false);
    }
  }

  const noProjects = projects.length === 0;

  return (
    <Modal
      open={open}
      title={isEdit ? 'Edit task' : 'New task'}
      onClose={saving ? () => {} : onClose}
      footer={
        <>
          <button type="button" className="btn btn--secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="submit"
            form={FORM_ID}
            className="btn btn--primary"
            disabled={saving || noProjects}
          >
            {saving ? <Spinner size={16} label="Saving" /> : null}
            {isEdit ? 'Save changes' : 'Create task'}
          </button>
        </>
      }
    >
      {formError ? (
        <div className="form-alert" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{formError}</span>
        </div>
      ) : null}

      {noProjects ? (
        <div className="form-alert form-alert--warning" role="status">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>Create a project first - every task belongs to one.</span>
        </div>
      ) : null}

      <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="stack">
        <FormField id="task-name" label="Task name" required error={errors.name}>
          {(props) => (
            <input
              {...props}
              className={`input ${errors.name ? 'input--invalid' : ''}`}
              value={values.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="Build component library"
              autoFocus
            />
          )}
        </FormField>

        <FormField id="task-project" label="Project" required error={errors.projectId}>
          {(props) => (
            <select
              {...props}
              className="select"
              value={values.projectId}
              onChange={(event) => setField('projectId', event.target.value)}
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField id="task-description" label="Description" error={errors.description} hint="Optional">
          {(props) => (
            <textarea
              {...props}
              className={`textarea ${errors.description ? 'textarea--invalid' : ''}`}
              value={values.description}
              onChange={(event) => setField('description', event.target.value)}
              placeholder="What needs to happen?"
            />
          )}
        </FormField>

        <div className="field__row">
          <FormField id="task-priority" label="Priority" error={errors.priority}>
            {(props) => (
              <select
                {...props}
                className="select"
                value={values.priority}
                onChange={(event) => setField('priority', event.target.value)}
              >
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <FormField id="task-status" label="Status" error={errors.status}>
            {(props) => (
              <select
                {...props}
                className="select"
                value={values.status}
                onChange={(event) => setField('status', event.target.value)}
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            )}
          </FormField>
        </div>

        <FormField id="task-due" label="Due date" error={errors.dueDate}>
          {(props) => (
            <input
              {...props}
              type="date"
              className={`input ${errors.dueDate ? 'input--invalid' : ''}`}
              value={values.dueDate}
              onChange={(event) => setField('dueDate', event.target.value)}
            />
          )}
        </FormField>
      </form>
    </Modal>
  );
}
