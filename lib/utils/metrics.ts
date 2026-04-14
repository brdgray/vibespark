/**
 * startup_spark_score_metrics is a Postgres VIEW — PostgREST has no FK to auto-join it.
 * Fetch metrics separately and merge them in so component code is unchanged.
 */
export async function fetchMetricsMap(
  supabase: any,
  startupIds: string[]
): Promise<Record<string, any>> {
  if (!startupIds.length) return {}
  const { data } = await supabase
    .from('startup_spark_score_metrics')
    .select('*')
    .in('startup_id', startupIds)
  const map: Record<string, any> = {}
  for (const m of data ?? []) {
    map[m.startup_id] = m
  }
  return map
}

/** Attaches metrics to each startup as startup_spark_score_metrics[0] */
export function withMetrics<T extends { id: string }>(
  startups: T[],
  metricsMap: Record<string, any>
): (T & { startup_spark_score_metrics: any[] })[] {
  return startups.map(s => ({
    ...s,
    startup_spark_score_metrics: [metricsMap[s.id] ?? {}],
  }))
}
