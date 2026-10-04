import { useState } from 'react';
import EloTrendChart from './EloTrendChart';
import LeaderboardPanel from './LeaderboardPanel';

function percentileLabel(value, sampleSize) {
  if (value == null || sampleSize < 2) return `Building sample (${sampleSize})`;
  return `Top ${100 - value}%`;
}

export default function GlobalPrestigePanel({ result, leaderboards }) {
  const [shareMessage, setShareMessage] = useState('');
  const percentileRows = [
    ['Global percentile', result.generalPercentile, result.percentileSamples?.global],
    ['Country percentile', result.countryPercentile, result.percentileSamples?.country],
    ['Age-group percentile', result.ageGroupPercentile, result.percentileSamples?.ageGroup],
    ['University percentile', result.universityPercentile, result.percentileSamples?.university]
  ];

  const shareProfile = async () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas is unavailable.');

      const background = context.createLinearGradient(0, 0, 1200, 630);
      background.addColorStop(0, '#07111f');
      background.addColorStop(1, '#172554');
      context.fillStyle = background;
      context.fillRect(0, 0, 1200, 630);
      context.fillStyle = 'rgba(56, 189, 248, 0.12)';
      context.beginPath();
      context.arc(1080, 80, 280, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#38bdf8';
      context.font = '700 26px Segoe UI, sans-serif';
      context.fillText('GLOBAL CAREER ELO', 72, 88);
      context.fillStyle = '#e2e8f0';
      context.font = '800 58px Segoe UI, sans-serif';
      context.fillText(`@${result.username || 'career-profile'}`.slice(0, 32), 72, 180);
      context.fillStyle = '#94a3b8';
      context.font = '500 30px Segoe UI, sans-serif';
      context.fillText(result.prestigeTitles?.[0] || result.careerLevel || 'Career profile', 72, 242);
      context.fillStyle = '#38bdf8';
      context.font = '800 88px Segoe UI, sans-serif';
      context.fillText(String(result.generalElo ?? '—'), 72, 390);
      context.fillStyle = '#e2e8f0';
      context.font = '600 28px Segoe UI, sans-serif';
      context.fillText('GLOBAL CAREER ELO', 76, 438);
      context.fillStyle = '#94a3b8';
      context.font = '500 24px Segoe UI, sans-serif';
      context.fillText('Career profile ranking · independent from job applications', 72, 565);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Could not generate the profile card.');
      const file = new File([blob], `${result.username || 'career'}-elo-profile.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: 'Global Career ELO profile', files: [file] });
        setShareMessage('Career profile card shared.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
      setShareMessage('Career profile card downloaded as a PNG.');
    } catch (error) {
      if (error.name !== 'AbortError') setShareMessage('Unable to share this profile from this browser.');
    }
  };

  return (
    <section className="panel prestige-panel">
      <div className="panel-header">
        <div>
          <span className="feed-type">Public career ranking</span>
          <h3>@{result.username || 'career-profile'}</h3>
        </div>
        <button type="button" className="secondary-button" onClick={shareProfile}>Share career profile</button>
      </div>

      <div className="global-score-row">
        <div>
          <span className="stat-label">Global Career ELO</span>
          <strong className="global-elo-score">{result.generalElo ?? '—'}</strong>
        </div>
        <div>
          <span className="stat-label">Career level</span>
          <strong>{result.careerLevel || 'Career profile'}</strong>
        </div>
        <div>
          <span className="stat-label">ELO range</span>
          <strong>{result.generalEloRange?.min ?? '—'}–{result.generalEloRange?.max ?? '—'}</strong>
        </div>
      </div>

      <div className="prestige-title-row">
        {(result.prestigeTitles || []).length
          ? result.prestigeTitles.map((title) => <span className="prestige-title" key={title}>{title}</span>)
          : <span className="muted-note">Keep building the career-profile comparison pool to unlock percentile titles.</span>}
      </div>

      <div className="percentile-grid">
        {percentileRows.map(([label, value, sampleSize]) => (
          <div className="percentile-item" key={label}>
            <span>{label}</span>
            <strong>{percentileLabel(value, sampleSize || 0)}</strong>
            <small>{sampleSize || 0} profiles</small>
          </div>
        ))}
      </div>

      <EloTrendChart history={result.generalEloHistory || []} title="Global Career ELO progression" />
      <LeaderboardPanel entries={leaderboards?.global || []} />
      {shareMessage ? <p className="muted-note" role="status">{shareMessage}</p> : null}
      <small className="muted-note">
        Global Career ELO uses career-profile information only. Job descriptions, target roles, application scores, and recommendations do not affect it.
      </small>
    </section>
  );
}
