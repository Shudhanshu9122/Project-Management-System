import { Check, Pencil, Trash2 } from 'lucide-react';
import { TASK_PRIORITIES, TASK_STATUSES } from '../constants';
import { PriorityBadge, TaskStatusBadge } from './Badge';

function dueMeta(task, isComplete, isOverdue) {
  if (!task.dueDate) return <span>No due date</span>;
  return (
    <span className={isOverdue ? 'overdue' : undefined}>
      {isOverdue ? 'Overdue: ' : 'Due '}
      {task.dueDate}
    </span>
  );
}

export function TaskRow({
  task,
  showProject = false,
  compact = false,
  busy = false,
  onToggleComplete,
  onEdit,
  onDelete,
  onStatusChange,
  onPriorityChange,
}) {
  const isComplete = task.status === 'Completed';
  const isOverdue =
    Boolean(task.dueDate) && !isComplete && new Date(`${task.dueDate}T00:00:00`) < new Date(new Date().toDateString());

  const checkbox = (
    <button
      type="button"
      className={`task-row__check ${isComplete ? 'task-row__check--done' : ''}`}
      onClick={() => onToggleComplete(task)}
      disabled={busy}
      aria-pressed={isComplete}
      aria-label={isComplete ? `Mark ${task.name} as pending` : `Mark ${task.name} as completed`}
    >
      <span
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 19,
          height: 19,
          borderRadius: 5,
          border: `1.5px solid ${isComplete ? 'var(--green-600)' : 'var(--border-strong)'}`,
          background: isComplete ? 'var(--green-600)' : 'transparent',
          color: '#fff',
        }}
      >
        {isComplete ? <Check size={12} aria-hidden="true" /> : null}
      </span>
    </button>
  );

  // Compact rows (dashboard "Today's focus") are read-only apart from the
  // checkbox: editing, deleting and the inline selects live on the Tasks page.
  if (compact) {
    return (
      <div className="task-row">
        {checkbox}

        <div className="task-row__main" style={{ cursor: 'default' }}>
          <span className={`task-row__name ${isComplete ? 'task-row__name--done' : ''}`}>
            {task.name}
          </span>
          <span className="task-row__meta">
            {showProject && task.projectName ? <span>{task.projectName}</span> : null}
            {showProject && task.projectName ? <span aria-hidden="true">·</span> : null}
            <span>{task.status}</span>
            <span aria-hidden="true">·</span>
            {dueMeta(task, isComplete, isOverdue)}
          </span>
        </div>

        <div className="task-row__badges">
          <PriorityBadge priority={task.priority} />
        </div>
      </div>
    );
  }

  return (
    <div className="task-row">
      {checkbox}

      <button type="button" className="task-row__main" onClick={() => onEdit(task)}>
        <span className={`task-row__name ${isComplete ? 'task-row__name--done' : ''}`}>{task.name}</span>
        <span className="task-row__meta">
          {showProject ? <span>{task.projectName}</span> : null}
          {showProject && task.dueDate ? <span aria-hidden="true">·</span> : null}
          {dueMeta(task, isComplete, isOverdue)}
        </span>
      </button>

      <div className="task-row__badges">
        <PriorityBadge priority={task.priority} />
        {showProject ? null : <TaskStatusBadge status={task.status} />}
      </div>

      <div className="task-row__actions">
        <label className="visually-hidden" htmlFor={`status-${task.id}`}>
          Status for {task.name}
        </label>
        <select
          id={`status-${task.id}`}
          className="inline-select"
          value={task.status}
          onChange={(event) => onStatusChange(task, event.target.value)}
          disabled={busy}
          title="Change status"
        >
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <label className="visually-hidden" htmlFor={`priority-${task.id}`}>
          Priority for {task.name}
        </label>
        <select
          id={`priority-${task.id}`}
          className="inline-select"
          value={task.priority}
          onChange={(event) => onPriorityChange(task, event.target.value)}
          disabled={busy}
          title="Change priority"
        >
          {TASK_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn btn--ghost btn--icon"
          onClick={() => onEdit(task)}
          aria-label={`Edit ${task.name}`}
        >
          <Pencil size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--icon"
          onClick={() => onDelete(task)}
          aria-label={`Delete ${task.name}`}
        >
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
