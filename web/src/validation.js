// Client-side rules mirror backend/src/validators/schemas.js. They exist to give
// instant feedback; the server remains the authority and its per-field errors
// are merged on top of these.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRealCalendarDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function validateDate(value, label) {
  if (!value) return undefined;
  if (!DATE_PATTERN.test(value) || !isRealCalendarDate(value)) {
    return `${label} must be a real date in YYYY-MM-DD format.`;
  }
  return undefined;
}

function required(value, label) {
  return typeof value === 'string' && value.trim() === '' ? `${label} is required.` : undefined;
}

export function validateLoginForm({ email, password }) {
  const errors = {};

  if (!email || email.trim() === '') errors.email = 'Email is required.';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.';

  if (!password) errors.password = 'Password is required.';

  return errors;
}

export function validateRegisterForm({ fullName, email, password }) {
  const errors = {};

  errors.fullName = required(fullName, 'Full name');
  if (!errors.fullName && fullName.trim().length > 120) {
    errors.fullName = 'Full name must be at most 120 characters.';
  }

  if (!email || email.trim() === '') errors.email = 'Email is required.';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.';

  if (!password) errors.password = 'Password is required.';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
  else if (password.length > 72) errors.password = 'Password must be at most 72 characters.';
  else if (!/[A-Za-z]/.test(password)) errors.password = 'Password must contain at least one letter.';
  else if (!/\d/.test(password)) errors.password = 'Password must contain at least one number.';

  return errors;
}

export function validateProjectForm({ name, description, startDate, endDate }) {
  const errors = {};

  errors.name = required(name, 'Project name');
  if (!errors.name && name.trim().length > 120) {
    errors.name = 'Project name must be at most 120 characters.';
  }

  if (description && description.length > 2000) {
    errors.description = 'Description must be at most 2000 characters.';
  }

  errors.startDate = validateDate(startDate, 'Start date');
  errors.endDate = validateDate(endDate, 'End date');

  if (!errors.startDate && !errors.endDate && startDate && endDate && endDate < startDate) {
    errors.endDate = 'End date cannot be earlier than the start date.';
  }

  return compact(errors);
}

export function validateTaskForm({ name, description, projectId, dueDate }) {
  const errors = {};

  errors.name = required(name, 'Task name');
  if (!errors.name && name.trim().length > 160) {
    errors.name = 'Task name must be at most 160 characters.';
  }

  if (!projectId) errors.projectId = 'Project is required.';

  if (description && description.length > 2000) {
    errors.description = 'Description must be at most 2000 characters.';
  }

  errors.dueDate = validateDate(dueDate, 'Due date');

  return compact(errors);
}

function compact(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
}
