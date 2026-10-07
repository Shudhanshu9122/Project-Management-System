export function FilterChips({ label, options, value, onChange }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      <button
        type="button"
        className={`chip ${value === '' ? 'chip--active' : ''}`}
        aria-pressed={value === ''}
        onClick={() => onChange('')}
      >
        All
      </button>

      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`chip ${value === option ? 'chip--active' : ''}`}
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
