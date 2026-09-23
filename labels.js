export function analysisLabels(t, analysis) {
  if (!analysis) return {}
  const id = analysis.categoryId || 'unknown'
  const place = t(`place.${analysis.priorityPlace || 'school'}`)
  const contexts = (analysis.userContexts || []).filter(Boolean)
  return {
    problem: t(`problem.${id}`),
    category: t(`category.${id}`),
    road: t(`road.${analysis.roadType || 'local'}`),
    nearby: t(`landmark.${analysis.nearbyLandmark || 'none'}`),
    contexts: contexts.length ? contexts.map((ctx) => t(`ctx.${ctx}`)).join(', ') : t('ctx.none'),
    severity: t(`severity.${analysis.severity || 'Medium'}`),
    priority: t(`priority.${analysis.priority || 'Normal'}`),
    reason: t(analysis.priorityReasonKey || 'reason.normal', { place }),
  }
}
