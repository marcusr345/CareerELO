export default function EloTrendChart({ history = [], title = 'ELO progression' }) {
  if (!history.length) {
    return (
      <div className="mini-panel">
        <h4>{title}</h4>
        <p>No history yet.</p>
      </div>
    );
  }

  const values = history.map((item) => Number(item.elo || item.score || 1400));
  const max = Math.max(...values, 1500);
  const min = Math.min(...values, 1200);

  return (
    <div className="mini-panel">
      <h4>{title}</h4>
      <div className="sparkline-wrap">
        {values.map((value, index) => {
          const height = ((value - min) / Math.max(max - min, 1)) * 100;
          return (
            <span
              key={`${value}-${index}`}
              className="sparkline-bar"
              style={{ height: `${Math.max(18, height)}%` }}
              title={`${value}`} 
            />
          );
        })}
      </div>
      <div className="trend-meta">
        <span>Latest: {values[values.length - 1]}</span>
        <span>Volatility: {history[history.length - 1]?.delta ?? 0}</span>
      </div>
    </div>
  );
}
