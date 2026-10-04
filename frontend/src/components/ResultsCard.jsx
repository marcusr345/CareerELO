import SkillHeatmap from './SkillHeatmap';
import JdFitPanel from './JdFitPanel';
import TrajectoryPanel from './TrajectoryPanel';

export default function ResultsCard({ result }) {
  if (!result) {
    return (
      <aside className="panel placeholder-card">
        <div className="score-ring" />
        <h2>Awaiting application analysis</h2>
        <p>Analyze a target role to see its application percentile, keyword match, skill gaps, and recommendations.</p>
      </aside>
    );
  }

  return (
    <aside className="panel results-card">
      <div className="score-shell">
        <div className="label-row">
          <span className="status-dot" />
          <span>{result.percentileBand || 'Competitive range'}</span>
        </div>

        <div className="score-line">
          <span className="big-score">{result.applicationPercentile ?? result.percentile ?? 0}%</span>
          <span className="unit">application percentile</span>
        </div>
        <p className="application-pool-message">
          {Number(result.percentileSamples?.role || 0) < 2
            ? 'Application comparison is building as more role-specific benchmark submissions are recorded.'
            : `Your application score is in the top ${Math.max(1, 100 - (result.applicationPercentile ?? result.percentile ?? 0))}% of CareerELO benchmark submissions for this role.`}
        </p>
        <p className="field-help">
          This experimental model is not independently verified and does not guarantee hiring outcomes. Analysis is separate from Global Career ELO and is not shown on public leaderboards.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-box">
          <span className="stat-label">Application score</span>
          <strong>{result.applicationScore ?? result.score ?? 0}/100</strong>
        </div>
        <div className="stat-box">
          <span className="stat-label">Role match</span>
          <strong>{result.roleMatch ?? 0}%</strong>
        </div>
        <div className="stat-box">
          <span className="stat-label">JD keyword match</span>
          <strong>{result.jdFit?.fitScore ?? 0}%</strong>
        </div>
        <div className="stat-box">
          <span className="stat-label">CV health</span>
          <strong>{result.cvHealthScore ?? 0}/100</strong>
        </div>
      </div>

      <div className="insight-box">
        <h3>Insights</h3>
        <p>{result.summary || 'Your profile is strong but can be improved by clarifying measurable outcomes.'}</p>
        <ul>
          {(result.insights || []).map((insight, index) => (
            <li key={index}>{insight}</li>
          ))}
        </ul>
      </div>

      <div className="metrics-grid">
        <SkillHeatmap skillHeatmap={result.skillHeatmap || { strong: [], weak: [], missing: [] }} />
        <JdFitPanel jdFit={result.jdFit || { fitScore: 0, strong: [], missing: [] }} />
        <TrajectoryPanel prediction={result.prediction || {}} />
      </div>
    </aside>
  );
}
