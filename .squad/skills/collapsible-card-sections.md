# Skill: Collapsible Card Sections (React + CSS, no library)

Reusable pattern for collapsible sections in VS Code webview UI.

## Pattern

```tsx
const [open, setOpen] = useState(true);

// Inside a .card article:
<div className="section-header" onClick={() => setOpen((o) => !o)}>
  <h3 style={{ margin: 0 }}>Section Title</h3>
  <span className={`section-chevron ${open ? 'open' : ''}`}>▾</span>
</div>
<div className={`section-body ${open ? '' : 'collapsed'}`}>
  {/* collapsible content */}
</div>
```

### When header contains action buttons

Wrap buttons in a `stopPropagation` container so clicks don't collapse the section:

```tsx
<div className="section-header" onClick={() => setOpen((o) => !o)}>
  <h3 style={{ margin: 0 }}>Section Title</h3>
  <div
    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
    onClick={(e) => e.stopPropagation()}
  >
    <div className="action-row">
      <button className="btn btn-sm" onClick={handleSave}>Save</button>
    </div>
    <span className={`section-chevron ${open ? 'open' : ''}`}>▾</span>
  </div>
</div>
```

## CSS

```css
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.section-chevron {
  transition: transform var(--transition);
  font-size: 1.1rem;
  color: var(--ink-muted);
  flex-shrink: 0;
}

.section-chevron.open { transform: rotate(0deg); }
.section-chevron:not(.open) { transform: rotate(-90deg); }

.section-body {
  overflow: hidden;
  transition: max-height 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
  max-height: 9999px; /* must be explicit for animation to work */
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-body.collapsed {
  max-height: 0 !important;
}
```

## Notes

- `max-height: 9999px` on the open state is intentional — it enables the collapse animation. Without a numeric value on open, the `max-height` transition cannot animate.
- The `display: flex` on `.section-body` maintains the same gap as the parent `.card` element.
- This pattern is already used in this project — the CSS classes are global and ready to use.

## Segmented Pill Control (type selector)

```tsx
const [type, setType] = useState<'a' | 'b'>('a');

<div className="pbi-type-selector">
  <button
    type="button"
    className={`pbi-type-btn${type === 'a' ? ' active' : ''}`}
    onClick={() => setType('a')}
  >
    Option A
  </button>
  <button
    type="button"
    className={`pbi-type-btn${type === 'b' ? ' active' : ''}`}
    onClick={() => setType('b')}
  >
    Option B
  </button>
</div>
```

Use `key` prop on any child component to force remount (state reset) when type changes:

```tsx
<MyWizard key={`${type}-${itemId}`} ... />
```
