export function ProgressBar({ completed = 0, total = 0, showLabel = true }) {
  // A project with no tasks is 0% complete rather than 100%.
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="progress">
      <div
        className="progress__track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${completed} of ${total} tasks complete`}
      >
        <div className="progress__bar" style={{ width: `${percent}%` }} />
      </div>
      {showLabel ? (
        <div className="progress__label">
          <span>
            {completed}/{total} tasks
          </span>
          <span>{percent}%</span>
        </div>
      ) : null}
    </div>
  );
}
