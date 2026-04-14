import { BADGE_DEFINITIONS, ALL_BADGE_KEYS, type BadgeKey } from '@/lib/utils/badges'
import { cn } from '@/lib/utils'

interface BadgeDisplayProps {
  earnedKeys: string[]
  size?: 'sm' | 'md'
  showLocked?: boolean
}

export default function BadgeDisplay({ earnedKeys, size = 'md', showLocked = false }: BadgeDisplayProps) {
  const keysToShow = showLocked ? ALL_BADGE_KEYS : (earnedKeys as BadgeKey[])

  if (keysToShow.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {keysToShow.map(key => {
        const def = BADGE_DEFINITIONS[key as BadgeKey]
        if (!def) return null
        const earned = earnedKeys.includes(key)
        return (
          <div
            key={key}
            title={def.description}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border font-medium',
              size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
              earned
                ? def.color
                : 'bg-slate-50 text-slate-300 border-slate-200 opacity-60'
            )}
          >
            <span>{def.emoji}</span>
            <span>{def.label}</span>
          </div>
        )
      })}
    </div>
  )
}
