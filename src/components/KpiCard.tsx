import type { ReactNode } from 'react';

export function KpiCard({
  label,
  value,
  sublabel,
  icon,
  tone = 'default',
  trend,
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon?: ReactNode;
  tone?: 'default' | 'positive' | 'negative' | 'accent' | 'owner';
  trend?: { value: string; positive: boolean };
}) {
  const toneStyles = {
    default: 'border-ink-200',
    positive: 'border-emerald-200',
    negative: 'border-rose-200',
    accent: 'border-brand-200',
    owner: 'border-amber-300 bg-gradient-to-br from-amber-50/60 to-white',
  }[tone];

  const iconBg = {
    default: 'bg-ink-100 text-ink-600',
    positive: 'bg-emerald-100 text-emerald-600',
    negative: 'bg-rose-100 text-rose-600',
    accent: 'bg-brand-100 text-brand-700',
    owner: 'bg-amber-100 text-amber-700',
  }[tone];

  return (
    <div
      className={`group relative bg-white rounded-xl border ${toneStyles} p-5 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide truncate">{label}</p>
          <p className="mt-2 text-2xl font-bold text-ink-900 tabular-nums">{value}</p>
          {sublabel && <p className="mt-1 text-xs text-ink-400">{sublabel}</p>}
        </div>
        {icon && (
          <div className={`shrink-0 p-2.5 rounded-lg ${iconBg} transition-transform group-hover:scale-110`}>
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className={`text-xs font-semibold ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}
          >
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
          <span className="text-xs text-ink-400">vs. mes anterior</span>
        </div>
      )}
    </div>
  );
}
