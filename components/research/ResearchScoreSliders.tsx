'use client'

import { cn } from '@/lib/utils'
import {
  RESEARCH_CRITERIA_DEFS,
  type ResearchCriteriaScores,
} from '@/lib/constants/research-criteria'

interface Props {
  scores: ResearchCriteriaScores
  onChange: (next: ResearchCriteriaScores) => void
  disabled?: boolean
}

export default function ResearchScoreSliders({ scores, onChange, disabled }: Props) {
  function set<K extends keyof ResearchCriteriaScores>(key: K, value: number) {
    onChange({ ...scores, [key]: value })
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-slate-900">Core criteria</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Slide each from 1 (low) to 10 (high). Founders see averages in aggregate; written notes may be part of a future paid tier.
        </p>
      </div>
      {RESEARCH_CRITERIA_DEFS.map(({ key, label, hint }) => (
        <div key={key} className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
            <span className="text-sm font-medium text-slate-800">{label}</span>
            <span className="tabular-nums text-sm font-bold text-orange-600">{scores[key]}/10</span>
          </div>
          <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={scores[key]}
            disabled={disabled}
            onChange={e => set(key, Number(e.target.value))}
            className={cn(
              'accent-orange-500 h-2 w-full min-w-0 cursor-pointer appearance-none rounded-full bg-slate-200',
              '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:shadow',
              '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-orange-500',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
            aria-valuemin={1}
            aria-valuemax={10}
            aria-valuenow={scores[key]}
            aria-label={label}
          />
          <div className="flex justify-between text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <span>1</span>
            <span>10</span>
          </div>
        </div>
      ))}
    </div>
  )
}
