const { z } = require('zod');

const PROJECT_STATUSES = ['Not Started', 'In Progress', 'Completed'];
const TASK_STATUSES = ['Pending', 'In Progress', 'Completed'];
const TASK_PRIORITIES = ['Low', 'Medium', 'High'];

const SORT_ORDERS = ['asc', 'desc'];
const PROJECT_SORTS = ['createdAt', 'name', 'startDate', 'endDate'];
const TASK_SORTS = ['createdAt', 'name', 'dueDate', 'priority', 'status'];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_PAGE_SIZE = 100;



function blankToUndefined(value) {
  return typeof value === 'string' && value.trim() === '' ? undefined : value;
}

function textField(label, max) {
  return z
    .string({ required_error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be at most ${max} characters.`);
}

function isRealCalendarDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}


function dateField(label) {
  return z
    .preprocess(
      (value) => (value === null ? '' : value),
      z
        .string({ invalid_type_error: `${label} must be a string in YYYY-MM-DD format.` })
        .trim()
        .refine(
          (value) => value === '' || DATE_PATTERN.test(value),
          `${label} must use the YYYY-MM-DD format.`
        )
        .refine(
          (value) => value === '' || isRealCalendarDate(value),
          `${label} is not a real calendar date.`
        )
        .transform((value) => (value === '' ? null : value))
    )
    .optional();
}

function optionalBodyText(label, max) {
  return z
    .preprocess(
      (value) => (value === null ? '' : value),
      z
        .string({ invalid_type_error: `${label} must be text.` })
        .trim()
        .max(max, `${label} must be at most ${max} characters.`)
        .transform((value) => (value === '' ? null : value))
    )
    .optional();
}

function optionalQueryText(label, max) {
  return z.preprocess(
    blankToUndefined,
    textField(label, max).optional()
  );
}

function optionalEnum(label, values) {
  return z.preprocess(
    blankToUndefined,
    z.enum(values, {
      errorMap: () => ({ message: `${label} must be one of: ${values.join(', ')}.` }),
    }).optional()
  );
}

function positiveIntField(label, { max, defaultValue }) {
  return z.preprocess(
    blankToUndefined,
    z.coerce
      .number({ invalid_type_error: `${label} must be a number.` })
      .int(`${label} must be a whole number.`)
      .min(1, `${label} must be 1 or greater.`)
      .max(max, `${label} must be at most ${max}.`)
      .default(defaultValue)
  );
}



const emailField = z
  .string({ required_error: 'Email is required.' })
  .trim()
  .min(1, 'Email is required.')
  .max(254, 'Email must be at most 254 characters.')
  .toLowerCase()
  .email('Enter a valid email address.');



const passwordField = z
  .string({ required_error: 'Password is required.' })
  .min(8, 'Password must be at least 8 characters.')
  .max(72, 'Password must be at most 72 characters.')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter.')
  .regex(/\d/, 'Password must contain at least one number.');



const loginPasswordField = z
  .string({ required_error: 'Password is required.' })
  .min(1, 'Password is required.')
  .max(72, 'Password must be at most 72 characters.');

const projectBase = z
  .object({
    name: textField('Project name', 120),
    description: optionalBodyText('Description', 2000),
    status: z
      .enum(PROJECT_STATUSES, {
        errorMap: () => ({ message: `Status must be one of: ${PROJECT_STATUSES.join(', ')}.` }),
      })
      .optional(),
    startDate: dateField('Start date'),
    endDate: dateField('End date'),
  })
  .strict();




const withDateOrder = (schema) =>
  schema.refine(
    (value) =>
      !value.startDate || !value.endDate || value.endDate >= value.startDate,
    { message: 'End date cannot be earlier than the start date.', path: ['endDate'] }
  );

const projectBody = withDateOrder(projectBase);

const projectUpdateBody = withDateOrder(
  projectBase
    .partial()
    .strict()
    .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update.')
);

const taskBody = z
  .object({
    projectId: z.string({ required_error: 'Project is required.' }).uuid('Project id must be a valid UUID.'),
    name: textField('Task name', 160),
    description: optionalBodyText('Description', 2000),
    priority: z
      .enum(TASK_PRIORITIES, {
        errorMap: () => ({ message: `Priority must be one of: ${TASK_PRIORITIES.join(', ')}.` }),
      })
      .optional(),
    status: z
      .enum(TASK_STATUSES, {
        errorMap: () => ({ message: `Status must be one of: ${TASK_STATUSES.join(', ')}.` }),
      })
      .optional(),
    dueDate: dateField('Due date'),
  })
  .strict();



const taskUpdateBody = taskBody
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update.');

const idParams = z.object({
  id: z.string().uuid('Id must be a valid UUID.'),
});

const listQuery = (sorts, extra) =>
  z.object({
    search: optionalQueryText('Search', 100),
    sort: optionalEnum('Sort', sorts),
    order: optionalEnum('Order', SORT_ORDERS),
    page: positiveIntField('Page', { max: 100_000, defaultValue: 1 }),
    limit: positiveIntField('Limit', { max: MAX_PAGE_SIZE, defaultValue: 10 }),
    ...extra,
  });

const projectsQuery = listQuery(PROJECT_SORTS, {
  status: optionalEnum('Status', PROJECT_STATUSES),
});

const tasksQuery = listQuery(TASK_SORTS, {
  projectId: z.preprocess(blankToUndefined, z.string().uuid('Project id must be a valid UUID.').optional()),
  status: optionalEnum('Status', TASK_STATUSES),
  priority: optionalEnum('Priority', TASK_PRIORITIES),
});



const authBody = z
  .object({
    fullName: textField('Full name', 120),
    email: emailField,
    password: passwordField,
  })
  .strict();

const loginBody = z
  .object({
    email: emailField,
    password: loginPasswordField,
  })
  .strict();

const emptyBody = z.object({}).strict();

module.exports = {
  projectDateOrderMessage: 'End date cannot be earlier than the start date.',
  PROJECT_STATUSES,
  TASK_STATUSES,
  TASK_PRIORITIES,
  PROJECT_SORTS,
  TASK_SORTS,
  SORT_ORDERS,
  MAX_PAGE_SIZE,
  schemas: {
    register: { body: authBody },
    login: { body: loginBody },
    logout: { body: emptyBody.optional() },
    idParams: { params: idParams },
    projectCreate: { body: projectBody },
    projectUpdate: { params: idParams, body: projectUpdateBody },
    projectList: { query: projectsQuery },
    taskCreate: { body: taskBody },
    taskUpdate: { params: idParams, body: taskUpdateBody },
    taskList: { query: tasksQuery },
  },
};
