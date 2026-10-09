import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api, buildQuery } from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import { useFetch } from '../hooks/useFetch';
import { useToast } from '../context/ToastContext';
import { TASK_PRIORITIES, TASK_SORTS, TASK_STATUSES } from '../constants';
import { TaskForm } from '../components/TaskForm';
import { TaskListSection } from '../components/TaskListSection';
import { FilterChips } from '../components/FilterChips';
import { SearchInput } from '../components/SearchInput';
import { Pagination } from '../components/Pagination';
import { ConfirmDialog } from '../components/ConfirmDialog';

const PAGE_SIZE = 12;

export function Tasks() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState(null);

  const toast = useToast();
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, priority, sort]);

  const query = buildQuery({ search: debouncedSearch, status, priority, sort, page, limit: PAGE_SIZE });
  const { data, loading, error, reload } = useFetch(
    (signal) => api.get(`/tasks${query}`, { signal }),
    [debouncedSearch, status, priority, sort, page]
  );

  // The task form needs the project list to choose a project and to allow moves.
  const projects = useFetch((signal) => api.get('/projects?limit=100&sort=name', { signal }), []);

  async function patchTask(task, changes) {
    setBusyTaskId(task.id);
    try {
      await api.put(`/tasks/${task.id}`, changes);
      reload();
    } catch (patchError) {
      toast.error('Could not update the task', patchError.message);
    } finally {
      setBusyTaskId(null);
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await api.delete(`/tasks/${pendingDelete.id}`);
      toast.success('Task deleted', pendingDelete.name);

      if (data && data.data.length === 1 && page > 1) setPage((current) => current - 1);
      else reload();

      setPendingDelete(null);
    } catch (deleteError) {
      toast.error('Could not delete the task', deleteError.message);
    } finally {
      setDeleting(false);
    }
  }

  const tasks = data ? data.data : [];

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__heading">
          <h1 className="page__title">My tasks</h1>
          <p className="page__subtitle">Every task across all of your projects.</p>
        </div>

        <div className="page__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            disabled={projects.data ? projects.data.data.length === 0 : false}
          >
            <Plus size={17} aria-hidden="true" />
            New task
          </button>
        </div>
      </div>

      <div className="toolbar">
        <SearchInput
          id="task-search"
          label="Search tasks"
          value={search}
          onChange={setSearch}
          placeholder="Search by task name"
        />

        <FilterChips label="Filter by status" options={TASK_STATUSES} value={status} onChange={setStatus} />
        <FilterChips label="Filter by priority" options={TASK_PRIORITIES} value={priority} onChange={setPriority} />

        <span className="toolbar__spacer" />

        <label className="visually-hidden" htmlFor="task-sort">
          Sort tasks
        </label>
        <select
          id="task-sort"
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
        tasks={tasks}
        loading={loading}
        error={error}
        onRetry={reload}
        showProject
        busyTaskId={busyTaskId}
        emptyTitle={search || status || priority ? 'No tasks match those filters' : 'No tasks yet'}
        emptyText={
          search || status || priority
            ? 'Try a different search term, or clear a filter.'
            : 'Add a task to one of your projects and it will show up here.'
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
          ) : null
        }
        onToggleComplete={(task) =>
          patchTask(task, { status: task.status === 'Completed' ? 'Pending' : 'Completed' })
        }
        onStatusChange={(task, nextStatus) => patchTask(task, { status: nextStatus })}
        onPriorityChange={(task, nextPriority) => patchTask(task, { priority: nextPriority })}
        onEdit={(task) => {
          setEditing(task);
          setFormOpen(true);
        }}
        onDelete={setPendingDelete}
      />

      {data && data.meta.total > 0 ? (
        <Pagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          total={data.meta.total}
          limit={data.meta.limit}
          onPageChange={setPage}
        />
      ) : null}

      <TaskForm
        open={formOpen}
        task={editing}
        projects={projects.data ? projects.data.data : []}
        onClose={() => setFormOpen(false)}
        onSaved={() => reload()}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete task"
        message={pendingDelete ? `"${pendingDelete.name}" will be permanently deleted.` : ''}
        busy={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
