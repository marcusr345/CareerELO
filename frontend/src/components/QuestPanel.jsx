export default function QuestPanel({ quests = [] }) {
  if (!quests.length) return null;

  return (
    <div className="mini-panel">
      <div className="panel-header">
        <h3>Career quests</h3>
        <span className="chip">{quests.length} active</span>
      </div>
      <ul className="stack-list">
        {quests.map((quest) => (
          <li key={quest.id} className="quest-row">
            <div>
              <strong>{quest.title}</strong>
              <p>{quest.description}</p>
            </div>
            <div className="reward-box">
              <small>{quest.rewardXp || 0} XP</small>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
