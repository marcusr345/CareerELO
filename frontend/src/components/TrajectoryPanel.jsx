export default function TrajectoryPanel({ prediction }) {
  if (!prediction) {
    return (
      <div className="mini-panel">
        <h4>Trajectory prediction</h4>
        <p>Prediction unavailable.</p>
      </div>
    );
  }

  return (
    <div className="mini-panel">
      <h4>Trajectory prediction</h4>
      <div className="trajectory-card">
        <div className="trajectory-head">
          <strong>{prediction.nextTitle || 'Senior specialist'}</strong>
          <span>{prediction.growthSignal || 'Healthy momentum'}</span>
        </div>
        <ul>
          {(prediction.adjacentRoles || []).map((role, index) => (
            <li key={`${role}-${index}`}>{role}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
