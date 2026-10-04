export default function GoalsPanel({ goals = [] }) {
  if (!goals.length) return null;

  return (
    <div className="mini-panel">
      <div className="panel-header">
        <h3>Goals tracker</h3>
        <span className="chip">Progress</span>
      </div>
      <ul className="goal-list">
        {goals.map((goal) => (
          <li key={goal.id}>
            <div className="goal-head">
              <strong>{goal.label}</strong>
              <span>{Math.round(goal.progress || 0)}%</span>
            </div>
            <div className="goal-bar">
              <span style={{ width: `${Math.min(100, goal.progress || 0)}%` }} />
            </div>
            <small>{goal.current} / {goal.target}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
