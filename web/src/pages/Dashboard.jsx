import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, FolderKanban, ListChecks } from 'lucide-react';
import { api } from '../api/client';
import { useFetch } from '../hooks/useFetch';
import { CHART_COLORS } from '../constants';
import { StatCard } from '../components/StatCard';
import { DonutChart } from '../components/DonutChart';
import { ProjectStatusBadge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import { StatSkeleton } from '../components/Skeleton';
import { EmptyState, ErrorState } from '../components/States';

const RECENT_PROJECTS_PAGE = { limit: 5, sort: 'createdAt', order: 'desc' };

export function Dashboard() {
  const stats = useFetch((signal) => api.get('/dashboard', { signal }), []);
  const recent = useFetch(
    (signal) =>
      api.get(`/projects?limit=${RECENT_PROJECTS_PAGE.limit}&sort=${RECENT_PROJECTS_PAGE.sort}&order=${RECENT_PROJECTS_PAGE.order}`, {
        signal,
      }),
    []
  );

  if (stats.loading || recent.loading) {
    return (
      <div className="grid grid--stats">
        {Array.from({ length: 6 }, (_, index) => (
          <StatSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (stats.error || recent.error) {
    const error = stats.error || recent.error;

    return (
      <div className="card">
        <ErrorState
          title="Could not load the dashboard"
          message={error.message}
          onRetry={() => {
            stats.reload();
            recent.reload();
          }}
        />
      </div>
    );
  }

  const data = stats.data.data;
  const projects = recent.data.data;

  const segments = [
    { label: 'Completed', value: data.completedTasks, color: CHART_COLORS.Completed },
    { label: 'In Progress', value: data.inProgressTasks, color: CHART_COLORS['In Progress'] },
    { label: 'Pending', value: data.pendingTasks, color: CHART_COLORS.Pending },
  ];

  return (
    <div className="page">
      <div className="grid grid--stats">
        <StatCard icon={FolderKanban} label="Total projects" value={data.totalProjects} tone="brand" />
        <StatCard icon={ListChecks} label="Total tasks" value={data.totalTasks} tone="info" />
        <StatCard icon={CheckCircle2} label="Completed tasks" value={data.completedTasks} tone="success" />
        <StatCard icon={Clock} label="Pending tasks" value={data.pendingTasks} tone="warning" />
        <StatCard icon={FolderKanban} label="Projects in progress" value={data.projectsInProgress} tone="info" />
        <StatCard icon={AlertTriangle} label="Overdue tasks" value={data.overdueTasks} tone="danger" />
      </div>

      <div className="grid grid--dashboard">
        <section className="card card--pad">
          <div className="card__header">
            <h2 className="card__title">Recent projects</h2>
            <span className="toolbar__spacer" />
            <Link to="/projects" className="btn btn--ghost btn--sm">
              View all
            </Link>
          </div>

          {projects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              text="Create your first project and this list fills in straight away."
              action={
                <Link to="/projects" className="btn btn--primary">
                  Go to projects
                </Link>
              }
            />
          ) : (
            <div className="stack">
              {projects.map((project) => (
                <div
                  key={project.id}
                  style={{ display: 'grid', gap: 8, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}
                >
                  <div className="row">
                    <Link to={`/projects/${project.id}`} style={{ fontWeight: 600, color: 'inherit' }}>
                      {project.name}
                    </Link>
                    <span className="toolbar__spacer" />
                    <ProjectStatusBadge status={project.status} />
                  </div>
                  <ProgressBar completed={project.completedTaskCount} total={project.taskCount} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card card--pad">
          <div className="card__header">
            <h2 className="card__title">Task breakdown</h2>
          </div>

          {data.totalTasks === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No tasks yet"
              text="Add a task to a project and the split appears here."
            />
          ) : (
            <DonutChart segments={segments} total={data.totalTasks} caption="tasks" />
          )}

          <p className="muted mt-4" style={{ fontSize: 'var(--text-xs)' }}>
            A task counts as overdue when its due date has passed and it is not completed.
          </p>
        </section>
      </div>
    </div>
  );
}
