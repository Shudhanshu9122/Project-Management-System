import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { FormField } from './FormField';
import { Spinner } from './Spinner';
import { PROJECT_STATUSES } from '../constants';
import { validateProjectForm } from '../validation';
import { api, ApiError } from '../api/client';
import { useToast } from '../context/ToastContext';

const FORM_ID = 'project-form';

const BLANK = {
  name: '',
  description: '',
  status: 'Not Started',
  startDate: '',
  endDate: '',
};

export function ProjectForm({ open, project, onClose, onSaved }) {
  const [values, setValues] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const isEdit = Boolean(project);

  // Re-seed the fields every time the dialog opens so a cancelled edit does not
  // bleed into the next one.
  useEffect(() => {
    if (!open) return;

    setValues(
      project
        ? {
            name: project.name,
            description: project.description || '',
            status: project.status,
            startDate: project.startDate || '',
            endDate: project.endDate || '',
          }
        : BLANK
    );
    setErrors({});
    setFormError(null);
  }, [open, project]);

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

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
      const response = isEdit
        ? await api.put(`/projects/${project.id}`, payload)
        : await api.post('/projects', payload);

      toast.success(isEdit ? 'Project updated' : 'Project created', response.data.name);
      onSaved(response.data);
      onClose();
    } catch (error) {
      const fields = error instanceof ApiError ? error.fieldErrors() : {};
      if (Object.keys(fields).length > 0) setErrors(fields);
      else setFormError(error.message || 'Could not save the project.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? 'Edit project' : 'New project'}
      onClose={saving ? () => {} : onClose}
      footer={
        <>
          <button type="button" className="btn btn--secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form={FORM_ID} className="btn btn--primary" disabled={saving}>
            {saving ? <Spinner size={16} label="Saving" /> : null}
            {isEdit ? 'Save changes' : 'Create project'}
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

      <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="stack">
        <FormField id="project-name" label="Project name" required error={errors.name}>
          {(props) => (
            <input
              {...props}
              className={`input ${errors.name ? 'input--invalid' : ''}`}
              value={values.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="Website Redesign"
              autoFocus
            />
          )}
        </FormField>

        <FormField id="project-description" label="Description" error={errors.description} hint="Optional">
          {(props) => (
            <textarea
              {...props}
              className={`textarea ${errors.description ? 'textarea--invalid' : ''}`}
              value={values.description}
              onChange={(event) => setField('description', event.target.value)}
              placeholder="What is this project about?"
            />
          )}
        </FormField>

        <FormField id="project-status" label="Status" error={errors.status}>
          {(props) => (
            <select
              {...props}
              className="select"
              value={values.status}
              onChange={(event) => setField('status', event.target.value)}
            >
              {PROJECT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <div className="field__row">
          <FormField id="project-start" label="Start date" error={errors.startDate}>
            {(props) => (
              <input
                {...props}
                type="date"
                className={`input ${errors.startDate ? 'input--invalid' : ''}`}
                value={values.startDate}
                onChange={(event) => setField('startDate', event.target.value)}
              />
            )}
          </FormField>

          <FormField id="project-end" label="End date" error={errors.endDate}>
            {(props) => (
              <input
                {...props}
                type="date"
                className={`input ${errors.endDate ? 'input--invalid' : ''}`}
                value={values.endDate}
                onChange={(event) => setField('endDate', event.target.value)}
              />
            )}
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
