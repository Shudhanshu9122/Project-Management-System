import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarRange, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, buildQuery } from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import { useFetch } from '../hooks/useFetch';
import { useToast } from '../context/ToastContext';
import { TASK_PRIORITIES, TASK_SORTS, TASK_STATUSES } from '../constants';
import { ProjectStatusBadge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import { ProjectForm } from '../components/ProjectForm';
import { TaskForm } from '../components/TaskForm';
import { TaskListSection } from '../components/TaskListSection';
import { FilterChips } from '../components/FilterChips';
import { SearchInput } from '../components/SearchInput';
import { Pagination } from '../components/Pagination';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ErrorState } from '../components/States';
import { PageSpinner } from '../components/Spinner';

const PAGE_SIZE = 10;

function formatRange(startDate, endDate) {
  if (!startDate && !endDate) return 'No dates set';
  if (startDate && !endDate) return `Starts ${startDate}`;
  if (!startDate && endDate) return `Ends ${endDate}`;
  return `${startDate} - ${endDate}`;
}

export function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [page, setPage] = useState(1);

  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [pendingTaskDelete, setPendingTaskDelete] = useState(null);
  const [pendingProjectDelete, setPendingProjectDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, priority, sort]);

  const project = useFetch((signal) => api.get(`/projects/${id}`, { signal }), [id]);

  const taskQuery = buildQuery({
    projectId: id,
    search: debouncedSearch,
    status,
    priority,
    sort,
    page,
    limit: PAGE_SIZE,
  });
  const tasks = useFetch(
    (signal) => api.get(`/tasks${taskQuery}`, { signal }),
    [id, debouncedSearch, status, priority, sort, page]
  );

  async function patchTask(task, changes) {
    setBusyTaskId(task.id);
    try {
      await api.put(`/tasks/${task.id}`, changes);
      tasks.reload();
      project.reload();
    } catch (error) {
      toast.error('Could not update the task', error.message);
    } finally {
      setBusyTaskId(null);
    }
  }

  async function handleTaskDelete() {
    setDeleting(true);
    try {
      await api.delete(`/tasks/${pendingTaskDelete.id}`);
      toast.success('Task deleted', pendingTaskDelete.name);
      setPendingTaskDelete(null);
      tasks.reload();
      project.reload();
    } catch (error) {
      toast.error('Could not delete the task', error.message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleProjectDelete() {
    setDeleting(true);
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      navigate('/projects', { replace: true });
    } catch (error) {
      toast.error('Could not delete the project', error.message);
      setDeleting(false);
    }
  }

  if (project.loading) return <PageSpinner label="Loading project" />;

  if (project.error) {
    const notFound = project.error.status === 404;

    return (
      <div className="card">
        <ErrorState
          title={notFound ? 'Project not found' : 'Could not load the project'}
          message={
            notFound
              ? 'It may have been deleted, or it belongs to another account.'
              : project.error.message
          }
          onRetry={notFound ? undefined : project.reload}
        />
        <div style={{ display: 'grid', placeItems: 'center', paddingBottom: 24 }}>
          <Link to="/projects" className="btn btn--secondary">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  const data = project.data.data;
  const taskList = tasks.data ? tasks.data.data : [];

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__heading">
          <Link
            to="/projects"
            className="row muted"
            style={{ fontSize: 'var(--text-sm)', marginBottom: 6, gap: 6 }}
          >
            <ArrowLeft size={15} aria-hidden="true" />
            All projects
          </Link>
          <h1 className="page__title">{data.name}</h1>
          <div className="row" style={{ marginTop: 8 }}>
            <ProjectStatusBadge status={data.status} />
            <span className="muted row" style={{ gap: 6 }}>
              <CalendarRange size={15} aria-hidden="true" />
              {formatRange(data.startDate, data.endDate)}
            </span>
          </div>
        </div>

        <div className="page__actions">
          <button type="button" className="btn btn--secondary" onClick={() => setProjectFormOpen(true)}>
            <Pencil size={16} aria-hidden="true" />
            Edit
          </button>
          <button type="button" className="btn btn--danger" onClick={() => setPendingProjectDelete(true)}>
            <Trash2 size={16} aria-hidden="true" />
            Delete
          </button>
        </div>
      </div>

      <section className="card card--pad">
        <p className="muted" style={{ marginBottom: 16 }}>
          {data.description || 'No description yet.'}
        </p>
        <ProgressBar completed={data.completedTaskCount} total={data.taskCount} />
      </section>

      <div className="page__header">
        <div className="page__heading">
          <h3 className="card__title">Tasks</h3>
        </div>
        <div className="page__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              setEditingTask(null);
              setTaskFormOpen(true);
            }}
          >
            <Plus size={17} aria-hidden="true" />
            Add task
          </button>
        </div>
      </div>

      <div className="toolbar">
        <SearchInput
          id="project-task-search"
          label="Search tasks in this project"
          value={search}
          onChange={setSearch}
          placeholder="Search tasks"
        />

        <FilterChips label="Filter by status" options={TASK_STATUSES} value={status} onChange={setStatus} />
        <FilterChips label="Filter by priority" options={TASK_PRIORITIES} value={priority} onChange={setPriority} />

        <span className="toolbar__spacer" />

        <label className="visually-hidden" htmlFor="project-task-sort">
          Sort tasks
        </label>
        <select
          id="project-task-sort"
          className="select"
          style={{ width: 180, minHeight: 38 }}
          value={sort}
          onChange={(event) => setSort(event.target.value)}
        >
          {TASK_SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              Sort: {option.label}
            </option>
          ))}
        </select>
      </div>

      <TaskListSection
        tasks={taskList}
        loading={tasks.loading}
        error={tasks.error}
        onRetry={tasks.reload}
        busyTaskId={busyTaskId}
        emptyTitle={search || status || priority ? 'No tasks match those filters' : 'No tasks in this project'}
        emptyText={
          search || status || priority
            ? 'Try a different search term, or clear a filter.'
            : 'Add the first task to start tracking progress.'
        }
        emptyAction={
          search || status || priority ? (
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                setSearch('');
                setStatus('');
                setPriority('');
              }}
            >
              Clear filters
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setEditingTask(null);
                setTaskFormOpen(true);
              }}
            >
              <Plus size={17} aria-hidden="true" />
              Add task
            </button>
          )
        }
        onToggleComplete={(task) =>
          patchTask(task, { status: task.status === 'Completed' ? 'Pending' : 'Completed' })
        }
        onStatusChange={(task, nextStatus) => patchTask(task, { status: nextStatus })}
        onPriorityChange={(task, nextPriority) => patchTask(task, { priority: nextPriority })}
        onEdit={(task) => {
          setEditingTask(task);
          setTaskFormOpen(true);
        }}
        onDelete={setPendingTaskDelete}
      />

      {tasks.data && tasks.data.meta.total > 0 ? (
        <Pagination
          page={tasks.data.meta.page}
          totalPages={tasks.data.meta.totalPages}
          total={tasks.data.meta.total}
          limit={tasks.data.meta.limit}
          onPageChange={setPage}
        />
      ) : null}

      <ProjectForm
        open={projectFormOpen}
        project={data}
        onClose={() => setProjectFormOpen(false)}
        onSaved={() => {
          project.reload();
          tasks.reload();
        }}
      />

      <TaskForm
        open={taskFormOpen}
        task={editingTask}
        projects={[{ id: data.id, name: data.name }]}
        defaultProjectId={data.id}
        onClose={() => setTaskFormOpen(false)}
        onSaved={() => {
          tasks.reload();
          project.reload();
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingTaskDelete)}
        title="Delete task"
        message={pendingTaskDelete ? `"${pendingTaskDelete.name}" will be permanently deleted.` : ''}
        busy={deleting}
        onConfirm={handleTaskDelete}
        onCancel={() => setPendingTaskDelete(null)}
      />

      <ConfirmDialog
        open={pendingProjectDelete}
        title="Delete project"
        message={`"${data.name}" and all ${data.taskCount} of its tasks will be permanently deleted.`}
        busy={deleting}
        onConfirm={handleProjectDelete}
        onCancel={() => setPendingProjectDelete(false)}
      />
    </div>
  );
}
