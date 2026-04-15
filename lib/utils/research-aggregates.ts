/**
 * Per-startup averages for structured research criteria (view: startup_research_criteria_aggregates).
 */
export async function fetchResearchCriteriaMap(
  supabase: { from: (t: string) => any },
  startupIds: string[],
): Promise<Record<string, any>> {
  if (!startupIds.length) return {}
  const { data } = await supabase
    .from('startup_research_criteria_aggregates')
    .select('*')
    .in('startup_id', startupIds)
  const map: Record<string, any> = {}
  for (const row of data ?? []) {
    map[row.startup_id] = row
  }
  return map
}
