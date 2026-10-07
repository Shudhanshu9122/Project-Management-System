import { Loader2 } from 'lucide-react';

export function Spinner({ size = 18, label = 'Loading' }) {
  return (
    <span role="status" aria-live="polite" style={{ display: 'inline-flex', alignItems: 'center' }}>
      <Loader2 className="spinner" size={size} aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </span>
  );
}

/** Full-height centred spinner used while a whole page is loading. */
export function PageSpinner({ label = 'Loading' }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', padding: '80px 0' }}>
      <Spinner size={28} label={label} />
    </div>
  );
}
