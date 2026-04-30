import { useState, useRef, useEffect } from 'react';

interface Props {
  label: string;
  value: string;
  options: string[];
  loading: boolean;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  onChange: (value: string) => void;
  onFallback?: (value: string) => void;
}

export function SearchableDropdown({
  label,
  value,
  options,
  loading,
  error,
  disabled,
  placeholder,
  helperText,
  onChange,
  onFallback
}: Props): JSX.Element {
  const [useFallback, setUseFallback] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelectOption = (option: string): void => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(0);
    if (error) {
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

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelectOption(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        break;
    }
  };

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
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <input
                type="text"
                value={isOpen ? searchTerm : value || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => !disabled && !loading && options.length > 0 && setIsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={loading ? 'Loading...' : placeholder || `Select ${label.toLowerCase()}`}
                disabled={disabled || loading || options.length === 0}
                ref={inputRef}
                style={{
                  width: '100%',
                  cursor: disabled || loading || options.length === 0 ? 'not-allowed' : 'text',
                  paddingRight: '32px'
                }}
              />
              {loading && (
                <span style={{ position: 'absolute', right: 12, pointerEvents: 'none' }}>
                  ⏳
                </span>
              )}
              {!loading && options.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    right: 12,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    color: 'var(--ink-muted)',
                    fontSize: '0.9rem',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform var(--transition)'
                  }}
                  onClick={() => !disabled && setIsOpen(!isOpen)}
                >
                  ▾
                </span>
              )}
            </div>
            {isOpen && filteredOptions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  maxHeight: '240px',
                  overflowY: 'auto',
                  background: 'var(--panel)',
                  border: '1px solid var(--line-strong)',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 1000
                }}
              >
                {filteredOptions.map((opt, idx) => (
                  <div
                    key={opt}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      background: idx === highlightedIndex ? 'var(--accent-soft)' : 'transparent',
                      color: 'var(--ink)',
                      fontSize: '0.9rem',
                      borderBottom: idx < filteredOptions.length - 1 ? '1px solid var(--line)' : 'none'
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelectOption(opt)}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
            {isOpen && filteredOptions.length === 0 && searchTerm && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  padding: '12px',
                  background: 'var(--panel)',
                  border: '1px solid var(--line-strong)',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow-md)',
                  color: 'var(--ink-muted)',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                  zIndex: 1000
                }}
              >
                No matches found for "{searchTerm}"
              </div>
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
