export default function CareerFeedPanel({ feed = [] }) {
  if (!feed.length) return null;

  return (
    <div className="mini-panel">
      <div className="panel-header">
        <h3>Career feed</h3>
        <span className="chip">Live</span>
      </div>
      <ul className="feed-list">
        {feed.map((item) => (
          <li key={item.id}>
            <span className="feed-type">{item.type}</span>
            <p>{item.summary || item.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
