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
    <div className="list-editor">
      <span className="hint">{label}</span>
      {values.length === 0 && <div className="hint">No items yet. Click "Add" to start.</div>}
      {values.map((value, index) => (
        <div key={index} className="list-editor-row">
          <input
            value={value}
            placeholder={placeholder}
            onChange={(event) => update(index, event.target.value)}
          />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(index)}>
            Remove
          </button>
        </div>
      ))}
      <div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={add}>
          + Add item
        </button>
      </div>
    </div>
  );
}
