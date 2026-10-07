export function Skeleton({ width = '100%', height = 12, className = '', style }) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ display: 'block', width, height, ...style }}
      aria-hidden="true"
    />
  );
}

export function StatSkeleton() {
  return (
    <div className="card">
      <div className="stat">
        <span className="skeleton" style={{ width: 44, height: 44, borderRadius: 12 }} />
        <div style={{ flex: 1 }}>
          <Skeleton className="skeleton--title" />
          <div style={{ height: 8 }} />
          <Skeleton width="70%" />
        </div>
      </div>
    </div>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="card card--pad">
      <Skeleton className="skeleton--title" />
      <div style={{ height: 10 }} />
      <Skeleton />
      <div style={{ height: 6 }} />
      <Skeleton width="60%" />
      <div style={{ height: 18 }} />
      <Skeleton height={8} style={{ borderRadius: 999 }} />
    </div>
  );
}

export function TaskRowSkeleton() {
  return (
    <div className="task-row" aria-hidden="true">
      <Skeleton width={44} height={44} style={{ borderRadius: 12, flex: '0 0 44px' }} />
      <div style={{ flex: 1 }}>
        <Skeleton width="45%" />
        <div style={{ height: 8 }} />
        <Skeleton width="28%" />
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 4, variant = 'task' }) {
  return (
    <div className="card">
      {Array.from({ length: rows }, (_, index) => (
        <TaskRowSkeleton key={index} />
      ))}
    </div>
  );
}
