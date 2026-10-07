import { AlertTriangle, RefreshCw } from 'lucide-react';

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="empty">
      {Icon ? (
        <span className="empty__icon">
          <Icon size={26} aria-hidden="true" />
        </span>
      ) : null}
      <h2 className="empty__title">{title}</h2>
      {text ? <p className="empty__text">{text}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <span className="error-state__icon">
        <AlertTriangle size={26} aria-hidden="true" />
      </span>
      <h2 className="error-state__title">{title}</h2>
      {message ? <p className="error-state__text">{message}</p> : null}
      {onRetry ? (
        <button type="button" className="btn btn--secondary" onClick={onRetry}>
          <RefreshCw size={16} aria-hidden="true" />
          Try again
        </button>
      ) : null}
    </div>
  );
}
