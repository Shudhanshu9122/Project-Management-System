export function StatCard({ icon: Icon, label, value, tone = 'info' }) {
  return (
    <div className="card">
      <div className="stat">
        <span className={`stat__icon stat__icon--${tone}`}>
          <Icon size={22} aria-hidden="true" />
        </span>
        <div>
          <p className="stat__value">{value}</p>
          <p className="stat__label">{label}</p>
        </div>
      </div>
    </div>
  );
}
