import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export function NotFound() {
  return (
    <div className="shell">
      <div className="main" style={{ marginLeft: 0, display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <div className="card card--pad" style={{ maxWidth: 460, textAlign: 'center' }}>
          <div className="empty">
            <span className="empty__icon">
              <Compass size={26} aria-hidden="true" />
            </span>
            <h1 className="empty__title">This page does not exist</h1>
            <p className="empty__text">
              The link may be out of date. Head back to the dashboard and carry on from there.
            </p>
            <Link to="/" className="btn btn--primary">
              Back to the dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
