export const RESEARCH_CRITERIA_DEFS = [
  {
    key: 'usability' as const,
    label: 'Usability',
    hint: 'Ease of use, navigation, and getting tasks done.',
  },
  {
    key: 'scalability' as const,
    label: 'Scalability',
    hint: 'Could this architecture and product grow with serious usage?',
  },
  {
    key: 'valueClarity' as const,
    label: 'Value clarity',
    hint: 'How quickly you understood what it does and who it is for.',
  },
  {
    key: 'desirability' as const,
    label: 'Desirability',
    hint: 'How compelling is the solution vs. the problem space?',
  },
  {
    key: 'trust' as const,
    label: 'Trust & polish',
    hint: 'Credibility, quality, and confidence you would rely on it.',
  },
] as const

export type ResearchCriteriaKey = (typeof RESEARCH_CRITERIA_DEFS)[number]['key']

export type ResearchCriteriaScores = Record<ResearchCriteriaKey, number>

export const DEFAULT_RESEARCH_CRITERIA_SCORES: ResearchCriteriaScores = {
  usability: 5,
  scalability: 5,
  valueClarity: 5,
  desirability: 5,
  trust: 5,
}

/** Map 1–10 value clarity to legacy 1–5 clarity_score for existing metrics/charts. */
export function valueClarityToLegacyClarity(valueClarity: number): number {
  const v = Math.max(1, Math.min(10, valueClarity))
  return Math.max(1, Math.min(5, Math.round(1 + ((v - 1) * 4) / 9)))
}

/** Row keys from `startup_research_criteria_aggregates` view */
export const CRITERIA_AGGREGATE_FIELD: Record<ResearchCriteriaKey, string> = {
  usability: 'avg_usability',
  scalability: 'avg_scalability',
  valueClarity: 'avg_value_clarity',
  desirability: 'avg_desirability',
  trust: 'avg_trust',
}
