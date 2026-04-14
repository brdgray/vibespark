const stageBadgeColors: Record<string, string> = {
  idea: 'bg-slate-100 text-slate-700 border-slate-200',
  prototype: 'bg-blue-100 text-blue-700 border-blue-200',
  mvp: 'bg-purple-100 text-purple-700 border-purple-200',
  live: 'bg-green-100 text-green-700 border-green-200',
  growing: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  monetizing: 'bg-amber-100 text-amber-700 border-amber-200',
  scaling: 'bg-orange-100 text-orange-700 border-orange-200',
}

export default function StageBadge({ stage }: { stage: string }) {
  const key = stage.toLowerCase()
  const colors = stageBadgeColors[key] ?? 'bg-slate-100 text-slate-700 border-slate-200'
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colors}`}>
      {stage}
    </span>
  )
}
