interface Props {
  label: string;
  values: string[];
  placeholder?: string;
  onChange: (next: string[]) => void;
}

export function ListEditor({ label, values, placeholder, onChange }: Props): JSX.Element {
  const update = (index: number, value: string): void => {
    const next = values.slice();
    next[index] = value;
    onChange(next);
  };

  const remove = (index: number): void => {
    onChange(values.filter((_, i) => i !== index));
  };

  const add = (): void => {
    onChange([...values, '']);
  };

  return (
    <div className="list-editor" role="group" aria-label={label}>
      <span className="hint">{label}</span>
      {values.length === 0 && <div className="hint" role="status">No items yet. Click "Add" to start.</div>}
      {values.map((value, index) => (
        <div key={index} className="list-editor-row">
          <input
            value={value}
            placeholder={placeholder}
            aria-label={`${label} item ${index + 1}`}
            onChange={(event) => update(index, event.target.value)}
          />
          <button 
            type="button" 
            className="btn btn-ghost btn-sm" 
            onClick={() => remove(index)}
            aria-label={`Remove ${label} item ${index + 1}`}
          >
            Remove
          </button>
        </div>
      ))}
      <div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={add} aria-label={`Add new ${label} item`}>
          + Add item
        </button>
      </div>
    </div>
  );
}
