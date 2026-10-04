export default function JdFitPanel({ jdFit = { fitScore: 0, strong: [], missing: [] } }) {
  return (
    <div className="mini-panel">
      <h4>JD-fit comparison</h4>
      <div className="fit-score-row">
        <strong>{jdFit.fitScore ?? 0}%</strong>
        <span>keyword match</span>
      </div>
      <div className="comparison-grid">
        <div>
          <span className="heatmap-label">Strong alignment</span>
          <div className="chip-row">
            {(jdFit.strong || []).length ? (
              jdFit.strong.map((item, index) => <span className="chip chip-strong" key={`${item}-${index}`}>{item}</span>)
            ) : (
              <span className="chip chip-neutral">No major overlaps</span>
            )}
          </div>
        </div>
        <div>
          <span className="heatmap-label">Missing keywords</span>
          <div className="chip-row">
            {(jdFit.missing || []).length ? (
              jdFit.missing.map((item, index) => <span className="chip chip-missing" key={`${item}-${index}`}>{item}</span>)
            ) : (
              <span className="chip chip-neutral">None</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
