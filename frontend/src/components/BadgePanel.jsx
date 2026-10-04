export default function BadgePanel({ badges = [] }) {
  if (!badges.length) return null;

  return (
    <div className="mini-panel">
      <div className="panel-header">
        <h3>Badges</h3>
        <span className="chip">{badges.length} unlocked</span>
      </div>
      <div className="badge-grid">
        {badges.map((badge) => (
          <div key={badge.id} className={`badge-card badge-${badge.tier || 'common'}`}>
            <strong>{badge.name}</strong>
            <span>{badge.tier}</span>
            <small>{badge.description}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
