import { Link } from 'react-router-dom';
import { CalendarRange, Pencil, Trash2 } from 'lucide-react';
import { ProjectStatusBadge } from './Badge';
import { ProgressBar } from './ProgressBar';

function formatRange(startDate, endDate) {
  if (!startDate && !endDate) return 'No dates set';
  if (startDate && !endDate) return `From ${startDate}`;
  if (!startDate && endDate) return `Until ${endDate}`;
  return `${startDate} - ${endDate}`;
}

export function ProjectCard({ project, onEdit, onDelete }) {
  return (
    <article className="card card--pad card--interactive">
      <div className="card__header">
        <h2 className="card__title" style={{ flex: 1, minWidth: 0 }}>
          <Link to={`/projects/${project.id}`} style={{ color: 'inherit' }}>
            {project.name}
          </Link>
        </h2>
        <ProjectStatusBadge status={project.status} />
      </div>

      <p className="card__meta" style={{ minHeight: 40 }}>
        {project.description || 'No description yet.'}
      </p>

      <p className="card__meta row" style={{ marginTop: 12 }}>
        <CalendarRange size={15} aria-hidden="true" />
        {formatRange(project.startDate, project.endDate)}
      </p>

      <div style={{ marginTop: 16 }}>
        <ProgressBar completed={project.completedTaskCount} total={project.taskCount} />
      </div>

      <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => onEdit(project)}
          aria-label={`Edit ${project.name}`}
        >
          <Pencil size={15} aria-hidden="true" />
          Edit
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => onDelete(project)}
          aria-label={`Delete ${project.name}`}
        >
          <Trash2 size={15} aria-hidden="true" />
          Delete
        </button>
      </div>
    </article>
  );
}
