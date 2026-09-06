interface Props {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  step?: string;
  min?: string;
  placeholder?: string;
}

export function NumberField({ label, value, onChange, step = 'any', min, placeholder }: Props) {
  return (
    <div className="field">
      <label>{label}</label>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        placeholder={placeholder ?? '—'}
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '' || raw === '-') {
            onChange(null);
            return;
          }
          const n = Number(raw);
          onChange(Number.isFinite(n) ? n : null);
        }}
      />
    </div>
  );
}
