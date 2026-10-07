import { ClipboardList } from 'lucide-react';
import { TaskRow } from './TaskRow';
import { ListSkeleton } from './Skeleton';
import { EmptyState, ErrorState } from './States';

/** Shared by the project detail page and the all-tasks page. */
export function TaskListSection({
  tasks,
  loading,
  error,
  onRetry,
  showProject = false,
  busyTaskId,
  emptyTitle,
  emptyText,
  emptyAction,
  onToggleComplete,
  onEdit,
  onDelete,
  onStatusChange,
  onPriorityChange,
}) {
  if (loading) return <ListSkeleton rows={4} />;

  if (error) {
    return (
      <div className="card">
        <ErrorState title="Could not load tasks" message={error.message} onRetry={onRetry} />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="card">
        <EmptyState icon={ClipboardList} title={emptyTitle} text={emptyText} action={emptyAction} />
      </div>
    );
  }

  return (
    <div className="card">
      <div className="task-list">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            showProject={showProject}
            busy={busyTaskId === task.id}
            onToggleComplete={onToggleComplete}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            onPriorityChange={onPriorityChange}
          />
        ))}
      </div>
    </div>
  );
}
