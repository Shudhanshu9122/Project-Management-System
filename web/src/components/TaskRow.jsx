import { Check, Pencil, Trash2 } from 'lucide-react';
import { TASK_PRIORITIES, TASK_STATUSES } from '../constants';
import { PriorityBadge, TaskStatusBadge } from './Badge';

export function TaskRow({
  task,
  showProject = false,
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

  return (
    <div className="task-row">
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
            width: 20,
            height: 20,
            borderRadius: 6,
            border: `2px solid ${isComplete ? 'var(--green-600)' : 'var(--border-strong)'}`,
            background: isComplete ? 'var(--green-600)' : 'transparent',
            color: '#fff',
          }}
        >
          {isComplete ? <Check size={13} aria-hidden="true" /> : null}
        </span>
      </button>

      <button type="button" className="task-row__main" onClick={() => onEdit(task)}>
        <span className={`task-row__name ${isComplete ? 'task-row__name--done' : ''}`}>{task.name}</span>
        <span className="task-row__meta">
          {showProject ? <span>{task.projectName}</span> : null}
          {showProject && task.dueDate ? <span aria-hidden="true">·</span> : null}
          {task.dueDate ? (
            <span className={isOverdue ? 'overdue' : undefined}>
              {isOverdue ? 'Overdue: ' : 'Due '}
              {task.dueDate}
            </span>
          ) : (
            <span>No due date</span>
          )}
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
          <Pencil size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--icon"
          onClick={() => onDelete(task)}
          aria-label={`Delete ${task.name}`}
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
