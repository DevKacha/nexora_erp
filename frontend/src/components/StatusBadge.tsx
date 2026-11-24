const colors: Record<string, string> = {
  lead: 'bg-amber-50 text-amber-700 border-amber-200/80',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200/80',
  unpaid: 'bg-rose-50 text-rose-700 border-rose-200/80',
  partial: 'bg-amber-50 text-amber-700 border-amber-200/80',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
};

const dotColors: Record<string, string> = {
  lead: 'bg-amber-500',
  active: 'bg-emerald-500',
  inactive: 'bg-gray-400',
  draft: 'bg-slate-400',
  confirmed: 'bg-emerald-500',
  cancelled: 'bg-rose-500',
  unpaid: 'bg-rose-500',
  partial: 'bg-amber-500',
  paid: 'bg-emerald-500',
};

export function StatusBadge({ value }: { value: string }) {
  const norm = value.toLowerCase();
  const badgeStyle = colors[norm] ?? 'bg-gray-100 text-gray-700 border-gray-200';
  const dotStyle = dotColors[norm] ?? 'bg-gray-400';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${badgeStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />
      {value}
    </span>
  );
}
