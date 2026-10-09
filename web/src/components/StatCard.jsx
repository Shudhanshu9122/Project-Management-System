// One cell in the dashboard stats strip: mono label, serif number, a short
// factual caption. No icons or coloured tiles - the typography does the work.
export function StatCard({ label, value, description, tone = 'neutral' }) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <p className={`stat__value ${tone === 'danger' ? 'stat__value--danger' : ''}`}>{value}</p>
      {description ? <p className="stat__desc">{description}</p> : null}
    </div>
  );
}
