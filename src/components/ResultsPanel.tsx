import type { FlagResult } from '../lib/types';
import { MetricCard } from './MetricCard';

export function ResultsPanel({ flags }: { flags: FlagResult[] }) {
  return (
    <div className="card">
      <h2>Derived metrics & flags</h2>
      <div className="metric-grid">
        {flags.map((f) => (
          <MetricCard key={f.key} flag={f} />
        ))}
      </div>
    </div>
  );
}
