// Spark Score weights — mirrors the SQL view in 004_spark_score.sql
const WEIGHTS = {
  supportVotes: 0.25,
  wouldUseYesPct: 0.25,
  saves: 0.15,
  comments: 0.10,
  researchCount: 0.15,
  momentum7d: 0.10,
} as const

export function computeSparkScore({
  supportCount,
  wouldUseYes,
  wouldUseTotal,
  saveCount,
  commentCount,
  researchCount,
  activity7d,
}: {
  supportCount: number
  wouldUseYes: number
  wouldUseTotal: number
  saveCount: number
  commentCount: number
  researchCount: number
  activity7d: number
}): number {
  const wouldUsePct = wouldUseTotal > 0 ? wouldUseYes / wouldUseTotal : 0
  const normalize = (n: number) => Math.min(Math.log1p(n) / Math.log1p(100), 1)

  const score =
    normalize(supportCount) * WEIGHTS.supportVotes +
    wouldUsePct * WEIGHTS.wouldUseYesPct +
    normalize(saveCount) * WEIGHTS.saves +
    normalize(commentCount) * WEIGHTS.comments +
    normalize(researchCount) * WEIGHTS.researchCount +
    normalize(activity7d) * WEIGHTS.momentum7d

  return Math.round(score * 100)
}

export function computeTrendingScore(activity7d: number, sparkScore: number): number {
  return Math.round((normalize(activity7d) * 0.7 + (sparkScore / 100) * 0.3) * 100)
}

function normalize(n: number): number {
  return Math.min(Math.log1p(n) / Math.log1p(100), 1)
}
