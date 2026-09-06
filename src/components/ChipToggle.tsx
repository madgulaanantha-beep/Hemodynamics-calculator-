interface Props {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function ChipToggle({ label, checked, onChange }: Props) {
  return (
    <label className={`chip ${checked ? 'on' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
