import { useState } from 'react';

interface Props {
  label: string;
  value: string;
  options: string[];
  loading: boolean;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  searchable?: boolean;
  onChange: (value: string) => void;
  onFallback?: (value: string) => void;
}

export function DropdownWithFallback({
  label,
  value,
  options,
  loading,
  error,
  disabled,
  placeholder,
  helperText,
  searchable = false,
  onChange,
  onFallback
}: Props): JSX.Element {
  const [useFallback, setUseFallback] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelectChange = (newValue: string): void => {
    onChange(newValue);
    if (error && newValue) {
      // Clear error state when user successfully selects an item
      setUseFallback(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = e.target.value;
    if (onFallback) {
      onFallback(newValue);
    } else {
      onChange(newValue);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = (): void => {
    setSearchTerm('');
  };

  const filteredOptions = searchable && searchTerm
    ? options.filter((opt) =>
        opt.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const showFallback = useFallback || (error && !loading);

  return (
    <label className="field">
      {label}
      {showFallback ? (
        <>
          <input
            type="text"
            value={value}
            onChange={handleTextChange}
            placeholder={placeholder}
            disabled={disabled}
          />
          {error && (
            <span className="chip danger" style={{ marginTop: 4, fontSize: '0.85rem' }}>
              {error} — using text input
            </span>
          )}
        </>
      ) : (
        <>
          {searchable && (
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder={`Search ${label.toLowerCase()}...`}
                disabled={disabled || loading}
                style={{ paddingRight: searchTerm ? 32 : undefined }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--ink-muted)',
                    fontSize: '1rem',
                    padding: '0 4px',
                    lineHeight: 1
                  }}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <select
              value={value}
              onChange={(e) => handleSelectChange(e.target.value)}
              disabled={disabled || loading || options.length === 0}
            >
              <option value="">
                {loading ? 'Loading...' : placeholder || `Select ${label.toLowerCase()}`}
              </option>
              {filteredOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {loading && (
              <span style={{ position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)' }}>
                ⏳
              </span>
            )}
          </div>
          {error && !loading && (
            <div style={{ marginTop: 4 }}>
              <span className="chip danger" style={{ fontSize: '0.85rem' }}>
                {error}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ marginLeft: 6 }}
                onClick={() => setUseFallback(true)}
              >
                Use text input instead
              </button>
            </div>
          )}
          {helperText && !error && (
            <p className="hint" style={{ marginTop: 4, fontSize: '0.85rem' }}>
              {helperText}
            </p>
          )}
        </>
      )}
    </label>
  );
}
