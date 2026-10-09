import { useEffect, useState } from 'react';
import { FolderKanban, Plus } from 'lucide-react';
import { api, buildQuery } from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import { useFetch } from '../hooks/useFetch';
import { useToast } from '../context/ToastContext';
import { PROJECT_SORTS, PROJECT_STATUSES } from '../constants';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectForm } from '../components/ProjectForm';
import { ProjectCardSkeleton } from '../components/Skeleton';
import { EmptyState, ErrorState } from '../components/States';
import { FilterChips } from '../components/FilterChips';
import { SearchInput } from '../components/SearchInput';
import { Pagination } from '../components/Pagination';
import { ConfirmDialog } from '../components/ConfirmDialog';

const PAGE_SIZE = 9;

export function Projects() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToast();
  const debouncedSearch = useDebounce(search, 300);

  // Any filter change invalidates the current page number.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, sort]);

  const query = buildQuery({ search: debouncedSearch, status, sort, page, limit: PAGE_SIZE });
  const { data, loading, error, reload } = useFetch(
    (signal) => api.get(`/projects${query}`, { signal }),
    [debouncedSearch, status, sort, page]
  );

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await api.delete(`/projects/${pendingDelete.id}`);
      toast.success('Project deleted', pendingDelete.name);

      // Stepping back avoids landing on a page that no longer exists.
      if (data && data.data.length === 1 && page > 1) setPage((current) => current - 1);
      else reload();

      setPendingDelete(null);
    } catch (deleteError) {
      toast.error('Could not delete the project', deleteError.message);
    } finally {
      setDeleting(false);
    }
  }

  function openCreateForm() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEditForm(project) {
    setEditing(project);
    setFormOpen(true);
  }

  const projects = data ? data.data : [];

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__heading">
          <h1 className="page__title">Projects</h1>
          <p className="page__subtitle">Everything you own, with task progress for each one.</p>
        </div>

        <div className="page__actions">
          <button type="button" className="btn btn--primary" onClick={openCreateForm}>
            <Plus size={17} aria-hidden="true" />
            New project
          </button>
        </div>
      </div>

      <div className="toolbar">
        <SearchInput
          id="project-search"
          label="Search projects"
          value={search}
          onChange={setSearch}
          placeholder="Search by project name"
        />

        <FilterChips label="Filter by status" options={PROJECT_STATUSES} value={status} onChange={setStatus} />

        <span className="toolbar__spacer" />

        <label className="visually-hidden" htmlFor="project-sort">
          Sort projects
        </label>
        <select
          id="project-sort"
          className="select"
          style={{ width: 180, minHeight: 38 }}
          value={sort}
          onChange={(event) => setSort(event.target.value)}
        >
          {PROJECT_SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              Sort: {option.label}
            </option>
          ))}
        </select>
      </div>

      {loading && projects.length === 0 ? (
        <div className="grid grid--projects">
          {Array.from({ length: 6 }, (_, index) => (
            <ProjectCardSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <div className="card">
          <ErrorState title="Could not load projects" message={error.message} onRetry={reload} />
        </div>
      ) : projects.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FolderKanban}
            title={search || status ? 'No projects match those filters' : 'No projects yet'}
            text={
              search || status
                ? 'Try a different search term or clear the status filter.'
                : 'Create a project to start tracking tasks against it.'
            }
            action={
              search || status ? (
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => {
                    setSearch('');
                    setStatus('');
                  }}
                >
                  Clear filters
                </button>
              ) : (
                <button type="button" className="btn btn--primary" onClick={openCreateForm}>
                  <Plus size={17} aria-hidden="true" />
                  New project
                </button>
              )
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid--projects">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={openEditForm}
                onDelete={setPendingDelete}
              />
            ))}
          </div>

          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            limit={data.meta.limit}
            onPageChange={setPage}
          />
        </>
      )}

      <ProjectForm
        open={formOpen}
        project={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => reload()}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete project"
        message={
          pendingDelete
            ? `"${pendingDelete.name}" and its ${pendingDelete.taskCount} task(s) will be permanently deleted.`
            : ''
        }
        busy={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
