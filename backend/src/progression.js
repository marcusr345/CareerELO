export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function normalizeUsername(username = 'student') {
  const normalized = String(username || 'student')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 40);
  return normalized || 'student';
}

export function computeCvHealthScore({ percentile = 0, roleMatch = 0, jdFit = 0, impactDensity = 0, score = 0, completeness = 0 }) {
  const total = percentile * 0.25 + roleMatch * 0.25 + jdFit * 0.2 + impactDensity * 0.15 + score * 0.1 + completeness * 0.05;
  return clamp(Math.round(total), 0, 100);
}

export function buildRoleSwitchSimulation({ currentRole, targetRole, currentScore, percentile, jdFit, roleMatch, skillHeatmap }) {
  const missingCount = (skillHeatmap.missing || []).length;
  const projectedScore = clamp(Math.round(currentScore + (jdFit - roleMatch) * 0.15 + (missingCount > 0 ? -5 : 2)), 0, 100);
  const projectedPercentile = clamp(Math.round(percentile + (projectedScore - currentScore) * 0.5), 1, 99);

  return {
    currentRole,
    targetRole,
    projectedScore,
    projectedPercentile,
    skillGaps: (skillHeatmap.missing || []).slice(0, 4),
    trajectory: projectedScore > currentScore ? 'promising' : 'exploration',
    roleSwitchQuest: `Build ${Math.max(2, 5 - Math.min(4, missingCount))} proof points for ${targetRole}`,
    jdFit,
    roleMatch
  };
}
