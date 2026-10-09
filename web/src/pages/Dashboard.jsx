import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, FolderKanban, Plus } from 'lucide-react';
import { api, buildQuery } from '../api/client';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CHART_COLORS } from '../constants';
import { StatCard } from '../components/StatCard';
import { DonutChart } from '../components/DonutChart';
import { ProjectStatusBadge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import { TaskRow } from '../components/TaskRow';
import { TaskForm } from '../components/TaskForm';
import { ProjectForm } from '../components/ProjectForm';
import { ListSkeleton, StatSkeleton } from '../components/Skeleton';
import { EmptyState, ErrorState } from '../components/States';

const RECENT_PROJECTS = { limit: 5, sort: 'createdAt', order: 'desc' };


const FOCUS_TASKS = { limit: 5, sort: 'priority', order: 'asc' };

const GREETINGS = [
  { until: 12, word: 'Good morning' },
  { until: 18, word: 'Good afternoon' },
  { until: 24, word: 'Good evening' },
];

function dateLine() {
  const now = new Date();
  const weekday = now.toLocaleDateString('en-GB', { weekday: 'long' });
  const day = now.getDate();
  const month = now.toLocaleDateString('en-GB', { month: 'long' });
  return `${weekday}, ${day} ${month}`;
}

export function Dashboard() {
  const toast = useToast();
  const { user } = useAuth();

  const stats = useFetch((signal) => api.get('/dashboard', { signal }), []);
  const focus = useFetch(
    (signal) => api.get(`/tasks${buildQuery(FOCUS_TASKS)}`, { signal }),
    []
  );
  const recent = useFetch(
    (signal) => api.get(`/projects${buildQuery(RECENT_PROJECTS)}`, { signal }),
    []
  );
  
  const projects = useFetch((signal) => api.get('/projects?limit=100&sort=name', { signal }), []);

  const [forms, setForms] = useState({ task: false, project: false });

  async function patchTask(task, changes) {
    const previousFocusData = focus.data;
    if (focus.data) {
      focus.setData({
        ...focus.data,
        data: focus.data.data.map((t) => (t.id === task.id ? { ...t, ...changes } : t)),
      });
    }

    try {
      await api.put(`/tasks/${task.id}`, changes);
      focus.reload();
      stats.reload();
      recent.reload();
    } catch (error) {
      if (previousFocusData) focus.setData(previousFocusData);
      toast.error('Could not update the task', error.message);
    }
  }

  function openForm(kind) {
    setForms((current) => ({ ...current, [kind]: true }));
  }

  function closeForm(kind) {
    setForms((current) => ({ ...current, [kind]: false }));
  }

  function handleSaved() {
    stats.reload();
    focus.reload();
    recent.reload();
    projects.reload();
  }

  const loading = stats.loading || focus.loading || recent.loading;
  const failed = stats.error || focus.error || recent.error;
  const isInitialLoad = !stats.data || !focus.data || !recent.data;

  if (loading && isInitialLoad) {
    return (
      <div className="page">
        <div className="stat-strip">
          {Array.from({ length: 6 }, (_, index) => (
            <StatSkeleton key={index} />
          ))}
        </div>
        <ListSkeleton rows={4} />
      </div>
    );
  }

  if (failed) {
    const error = failed;
    return (
      <div className="card">
        <ErrorState
          title="Could not load the dashboard"
          message={error.message}
          onRetry={() => {
            stats.reload();
            focus.reload();
            recent.reload();
          }}
        />
      </div>
    );
  }

  const data = stats.data.data;
  const focusTasks = focus.data.data;
  const recentProjects = recent.data.data;
  const projectList = projects.data ? projects.data.data : [];

  const hour = new Date().getHours();
  const greeting = GREETINGS.find((entry) => hour < entry.until).word;
  const firstName = user.fullName.trim().split(/\s+/)[0];

  const total = data.totalTasks;
  const finishedPct = total > 0 ? Math.round((data.completedTasks / total) * 100) : 0;
  const statCells = [
    {
      label: 'Projects',
      value: data.totalProjects,
      description: `${data.projectsInProgress} in progress`,
    },
    { label: 'Tasks', value: data.totalTasks, description: 'across every project' },
    {
      label: 'Finished',
      value: data.completedTasks,
      description: total > 0 ? `${finishedPct}% of all tasks` : 'nothing completed yet',
    },
    { label: 'Still to do', value: data.pendingTasks, description: 'waiting to start' },
    { label: 'In motion', value: data.inProgressTasks, description: 'being worked on' },
    {
      label: 'Overdue',
      value: data.overdueTasks,
      description: 'past the due date',
      tone: data.overdueTasks > 0 ? 'danger' : 'neutral',
    },
  ];

  const segments = [
    { label: 'Completed', value: data.completedTasks, color: CHART_COLORS.Completed },
    { label: 'In Progress', value: data.inProgressTasks, color: CHART_COLORS['In Progress'] },
    { label: 'Pending', value: data.pendingTasks, color: CHART_COLORS.Pending },
  ];

  const doneCount = focusTasks.filter((task) => task.status === 'Completed').length;

  return (
    <div className="page">
      <header className="page__header">
        <div className="page__heading">
          <p className="eyebrow">{dateLine()}</p>
          <h1 className="page__title page__title--display" style={{ marginTop: 8 }}>
            {greeting}, {firstName}.
          </h1>
        </div>

        <div className="page__actions">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => openForm('project')}
          >
            <Plus size={16} aria-hidden="true" />
            New project
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => openForm('task')}
            disabled={projectList.length === 0}
            title={projectList.length === 0 ? 'Create a project first' : undefined}
          >
            <Plus size={16} aria-hidden="true" />
            New task
          </button>
        </div>
      </header>

      <div className="stat-strip">
        {statCells.map((cell) => (
          <StatCard
            key={cell.label}
            label={cell.label}
            value={cell.value}
            description={cell.description}
            tone={cell.tone}
          />
        ))}
      </div>

      <div className="grid grid--dashboard">
        <section className="card">
          <div className="card__bar">
            <h2 className="card__bar-title">Today&rsquo;s focus</h2>
            <span className="card__bar-meta">
              {doneCount} of {focusTasks.length} done
            </span>
            <span className="toolbar__spacer" />
            <Link to="/tasks" className="link-arrow">
              All tasks &rarr;
            </Link>
          </div>

          {focusTasks.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Nothing on the list yet"
              text="Add a task to a project and the highest-priority work shows up here."
              action={
                <Link to="/projects" className="btn btn--secondary">
                  Go to projects
                </Link>
              }
            />
          ) : (
            <div className="task-list">
              {focusTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  compact
                  showProject
                  onToggleComplete={(item) =>
                    patchTask(item, {
                      status: item.status === 'Completed' ? 'Pending' : 'Completed',
                    })
                  }
                />
              ))}
            </div>
          )}
        </section>

        <div className="stack">
          <section className="card card--pad">
            <div className="section-head">
              <h2 className="section-head__title">Task breakdown</h2>
            </div>

            {data.totalTasks === 0 ? (
              <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
                No tasks yet. Once you add some, the split appears here.
              </p>
            ) : (
              <DonutChart segments={segments} total={data.totalTasks} caption="tasks" />
            )}
          </section>

          <section className="card">
            <div className="card__bar">
              <h2 className="card__bar-title">Projects</h2>
              <span className="toolbar__spacer" />
              <Link to="/projects" className="link-arrow">
                All projects &rarr;
              </Link>
            </div>

            {recentProjects.length === 0 ? (
              <EmptyState
                icon={FolderKanban}
                title="No projects yet"
                text="Create your first project and this list fills in straight away."
                action={
                  <button type="button" className="btn btn--primary" onClick={() => openForm('project')}>
                    <Plus size={16} aria-hidden="true" />
                    New project
                  </button>
                }
              />
            ) : (
              recentProjects.map((project) => (
                <div className="project-row" key={project.id}>
                  <div className="project-row__top">
                    <Link to={`/projects/${project.id}`} className="project-row__name">
                      {project.name}
                    </Link>
                    <span className="project-row__pct">
                      {project.taskCount > 0
                        ? `${Math.round((project.completedTaskCount / project.taskCount) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="project-row__meta">
                    <span>
                      {project.completedTaskCount} of {project.taskCount} finished
                    </span>
                    <span aria-hidden="true">&middot;</span>
                    <ProjectStatusBadge status={project.status} />
                    {project.endDate ? (
                      <>
                        <span aria-hidden="true">&middot;</span>
                        <span>by {project.endDate}</span>
                      </>
                    ) : null}
                  </div>
                  <ProgressBar
                    completed={project.completedTaskCount}
                    total={project.taskCount}
                    showLabel={false}
                  />
                </div>
              ))
            )}
          </section>
        </div>
      </div>

      <TaskForm
        open={forms.task}
        task={null}
        projects={projectList}
        onClose={() => closeForm('task')}
        onSaved={handleSaved}
      />

      <ProjectForm
        open={forms.project}
        project={null}
        onClose={() => closeForm('project')}
        onSaved={handleSaved}
      />
    </div>
  );
}
