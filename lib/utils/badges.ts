export type BadgeKey =
  | 'early_adopter'
  | 'spark_giver'
  | 'research_pro'
  | 'insight_machine'
  | 'supporter'
  | 'super_supporter'
  | 'trendsetter'
  | 'commentator'

export interface BadgeDef {
  key: BadgeKey
  label: string
  description: string
  emoji: string
  color: string
  points: number
}

export const BADGE_DEFINITIONS: Record<BadgeKey, BadgeDef> = {
  early_adopter: {
    key: 'early_adopter',
    label: 'Early Adopter',
    description: 'Among the first VibeSpark community members',
    emoji: '⚡',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    points: 0,
  },
  spark_giver: {
    key: 'spark_giver',
    label: 'Spark Giver',
    description: 'Gave first research feedback to a founder',
    emoji: '🔬',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    points: 0,
  },
  research_pro: {
    key: 'research_pro',
    label: 'Research Pro',
    description: 'Gave feedback on 10+ startups',
    emoji: '🧪',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    points: 0,
  },
  insight_machine: {
    key: 'insight_machine',
    label: 'Insight Machine',
    description: 'Gave feedback on 50+ startups',
    emoji: '🧠',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    points: 0,
  },
  supporter: {
    key: 'supporter',
    label: 'Supporter',
    description: 'Voted on 10+ startups',
    emoji: '🚀',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    points: 0,
  },
  super_supporter: {
    key: 'super_supporter',
    label: 'Super Supporter',
    description: 'Voted on 50+ startups',
    emoji: '🌟',
    color: 'bg-red-100 text-red-700 border-red-200',
    points: 0,
  },
  trendsetter: {
    key: 'trendsetter',
    label: 'Trendsetter',
    description: 'Saved 10+ startups to watchlist',
    emoji: '⭐',
    color: 'bg-green-100 text-green-700 border-green-200',
    points: 0,
  },
  commentator: {
    key: 'commentator',
    label: 'Commentator',
    description: 'Left 10+ comments on startups',
    emoji: '💬',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    points: 0,
  },
}

export const ALL_BADGE_KEYS = Object.keys(BADGE_DEFINITIONS) as BadgeKey[]
