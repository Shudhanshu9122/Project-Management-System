// These values are the same strings the API validates against. They are
// duplicated here rather than shared over the network because they change with
// the schema, which is a backend concern.

export const PROJECT_STATUSES = ['Not Started', 'In Progress', 'Completed'];
export const TASK_STATUSES = ['Pending', 'In Progress', 'Completed'];
export const TASK_PRIORITIES = ['Low', 'Medium', 'High'];

export const PROJECT_SORTS = [
  { value: 'createdAt', label: 'Newest first' },
  { value: 'name', label: 'Name' },
  { value: 'startDate', label: 'Start date' },
  { value: 'endDate', label: 'End date' },
];

export const TASK_SORTS = [
  { value: 'createdAt', label: 'Newest first' },
  { value: 'name', label: 'Name' },
  { value: 'dueDate', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
];

// Colour is never the only signal: every badge also renders its text.
export const PROJECT_STATUS_VARIANT = {
  'Not Started': 'neutral',
  'In Progress': 'info',
  Completed: 'success',
};

export const TASK_STATUS_VARIANT = {
  Pending: 'warning',
  'In Progress': 'info',
  Completed: 'success',
};

export const PRIORITY_VARIANT = {
  Low: 'neutral',
  Medium: 'warning',
  High: 'danger',
};

export const CHART_COLORS = {
  Pending: '#f59e0b',
  'In Progress': '#6366f1',
  Completed: '#10b981',
};
