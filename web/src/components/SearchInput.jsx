import { Search, X } from 'lucide-react';

export function SearchInput({ id = 'search', label, value, onChange, placeholder = 'Search' }) {
  return (
    <div className="search">
      <Search className="search__icon" size={17} aria-hidden="true" />
      <label className="visually-hidden" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="search"
        className="input"
        style={{ paddingRight: value ? 40 : undefined }}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {value ? (
        <button
          type="button"
          className="input-with-action__button"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <X size={16} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
