import { useEffect, useId, useRef, useState } from 'react';
import { useDavidDropdown } from './useDavidDropdown';

export interface DavidDropdownProps {
  label: string;
  value: string;
  options: readonly string[];
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  onChange: (value: string) => void;
}

/**
 * Accessible dropdown powered by david-ai programmatic Dropdown (Popper) + WAI-ARIA menu pattern.
 */
export function DavidDropdown({
  label,
  value,
  options,
  disabled = false,
  placeholder,
  helperText,
  onChange,
}: DavidDropdownProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const triggerId = useId();

  const { buttonRef, menuRef, closeMenu } = useDavidDropdown({
    open,
    onOpenChange: setOpen,
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    const selectedIndex = options.indexOf(value);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, options, value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const handleSelect = (option: string): void => {
    onChange(option);
    closeMenu();
    buttonRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (disabled) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) {
          setOpen(true);
        } else {
          setHighlightedIndex((prev) => Math.min(prev + 1, options.length - 1));
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (open) {
          setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (open && options[highlightedIndex]) {
          handleSelect(options[highlightedIndex]);
        } else if (!open) {
          setOpen(true);
        }
        break;
      case 'Escape':
        event.preventDefault();
        closeMenu();
        break;
      case 'Home':
        if (open) {
          event.preventDefault();
          setHighlightedIndex(0);
        }
        break;
      case 'End':
        if (open) {
          event.preventDefault();
          setHighlightedIndex(options.length - 1);
        }
        break;
      default:
        break;
    }
  };

  const displayValue = value || placeholder || `Select ${label.toLowerCase()}`;

  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <div ref={containerRef} className="david-dropdown">
        <button
          ref={buttonRef}
          type="button"
          id={triggerId}
          className="david-dropdown-trigger"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={listId}
          disabled={disabled || options.length === 0}
          onClick={() => {
            if (!disabled && options.length > 0) {
              setOpen((prev) => !prev);
            }
          }}
          onKeyDown={handleKeyDown}
        >
          <span className="david-dropdown-value">{displayValue}</span>
          <span className="david-dropdown-chevron" aria-hidden="true">
            ▾
          </span>
        </button>
        <div
          ref={menuRef}
          id={listId}
          role="menu"
          className="david-dropdown-menu hidden"
          hidden={!open}
          aria-labelledby={triggerId}
        >
          {options.map((option, index) => (
            <button
              key={option}
              type="button"
              role="menuitem"
              className={[
                'david-dropdown-item',
                option === value ? 'is-selected' : '',
                index === highlightedIndex ? 'is-highlighted' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              tabIndex={-1}
              aria-current={option === value ? 'true' : undefined}
              onClick={() => handleSelect(option)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      {helperText && (
        <p className="hint" style={{ marginTop: 4, fontSize: '0.85rem' }}>
          {helperText}
        </p>
      )}
    </label>
  );
}
