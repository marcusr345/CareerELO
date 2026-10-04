export default function SkillHeatmap({ skillHeatmap = { strong: [], weak: [], missing: [] } }) {
  const sections = [
    { label: 'Strong', items: skillHeatmap.strong || [] },
    { label: 'Weak', items: skillHeatmap.weak || [] },
    { label: 'Missing', items: skillHeatmap.missing || [] }
  ];

  return (
    <div className="mini-panel">
      <h4>Skill heatmap</h4>
      <div className="heatmap-grid">
        {sections.map((section) => (
          <div key={section.label} className="heatmap-block">
            <span className="heatmap-label">{section.label}</span>
            <div className="chip-row">
              {section.items.length ? (
                section.items.map((item, index) => (
                  <span className={`chip chip-${section.label.toLowerCase()}`} key={`${item}-${index}`}>
                    {item}
                  </span>
                ))
              ) : (
                <span className="chip chip-neutral">N/A</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
