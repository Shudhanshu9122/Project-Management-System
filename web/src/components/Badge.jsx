import { PRIORITY_VARIANT, PROJECT_STATUS_VARIANT, TASK_STATUS_VARIANT } from '../constants';

export function Badge({ children, variant = 'neutral' }) {
  const variantClass = variant === 'neutral' ? '' : `badge--${variant}`;

  return <span className={`badge ${variantClass}`}>{children}</span>;
}

export function ProjectStatusBadge({ status }) {
  return <Badge variant={PROJECT_STATUS_VARIANT[status] || 'neutral'}>{status}</Badge>;
}

export function TaskStatusBadge({ status }) {
  return <Badge variant={TASK_STATUS_VARIANT[status] || 'neutral'}>{status}</Badge>;
}


export function PriorityBadge({ priority }) {
  return <Badge variant={PRIORITY_VARIANT[priority] || 'neutral'}>{priority}</Badge>;
}
