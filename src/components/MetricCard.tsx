import type { FlagResult } from '../lib/types';

export function MetricCard({ flag }: { flag: FlagResult }) {
  const range =
    flag.normalLow !== null || flag.normalHigh !== null
      ? `nl ${flag.normalLow ?? '—'}–${flag.normalHigh ?? '—'}`
      : '';

  return (
    <div className={`metric ${flag.status}`} title={flag.note}>
      <div className="label">
        {flag.label}
        <span className={`badge ${flag.status}`}>{flag.status}</span>
      </div>
      <div className="value">
        {flag.value === null ? '—' : flag.value}
        {flag.value !== null && flag.unit ? (
          <span style={{ fontSize: '0.7rem', color: 'var(--muted)', marginLeft: 4 }}>{flag.unit}</span>
        ) : null}
      </div>
      {range ? <div className="range">{range}</div> : null}
      {flag.note ? <div className="range">{flag.note}</div> : null}
    </div>
  );
}
