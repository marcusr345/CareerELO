const sampleProfile = {
  name: 'Alicia R.',
  role: 'Software Engineer',
  experience: '5',
  skills: 'JavaScript, TypeScript, React, Node, SQL, AWS',
  education: "Bachelor's",
  location: 'Remote',
  industry: 'Technology',
  cvSummary:
    'Led a product redesign that increased retention by 18%, built internal dashboards with SQL and React, and shipped a customer-facing analytics feature used by 10k users.'
};

const form = document.getElementById('cvForm');
const demoButton = document.getElementById('demoButton');
const formMessage = document.getElementById('formMessage');
const percentileValue = document.getElementById('percentileValue');
const eloValue = document.getElementById('eloValue');
const labelValue = document.getElementById('labelValue');
const promptValue = document.getElementById('promptValue');
const roleMatchValue = document.getElementById('roleMatchValue');
const scoreValue = document.getElementById('scoreValue');
const insightList = document.getElementById('insightList');
const opportunityList = document.getElementById('opportunityList');
const leaderboardEl = document.getElementById('leaderboard');

function updateFormValues(data) {
  Object.entries(data).forEach(([field, value]) => {
    const element = document.getElementById(field);
    if (element) element.value = value;
  });
}

function renderLeaderboard(entries) {
  leaderboardEl.innerHTML = '';
  if (!entries || !entries.length) {
    leaderboardEl.innerHTML = '<div class="leaderboard-item"><div><strong>No entries yet</strong></div></div>';
    return;
  }

  entries.forEach((entry, index) => {
    const row = document.createElement('div');
    row.className = 'leaderboard-item';
    row.innerHTML = `
      <div>
        <strong>#${index + 1} ${entry.name || 'Anonymous User'}</strong>
        <div class="leaderboard-meta">${entry.role} • ${new Date(entry.createdAt).toLocaleDateString()}</div>
      </div>
      <div class="leaderboard-score">${entry.percentile}%</div>
    `;
    leaderboardEl.appendChild(row);
  });
}

function renderResult(result) {
  const percentile = result.percentile;
  let bandText = 'Needs sharper positioning';
  if (percentile >= 80) bandText = 'Top 20%';
  else if (percentile >= 60) bandText = 'Above average';
  else if (percentile >= 40) bandText = 'Competitive range';

  labelValue.textContent = bandText;
  percentileValue.textContent = `${percentile}%`;
  eloValue.textContent = `${result.elo}`;
  roleMatchValue.textContent = `${result.roleMatch}% match`;
  scoreValue.textContent = `${result.cvScore}/100`;
  promptValue.textContent = result.prompt.length > 18 ? `${result.prompt.substring(0, 18)}…` : result.prompt;
  insightList.innerHTML = `
    <li>${result.strengths[0] || 'You have a strong foundation to build from.'}</li>
    <li>${result.opportunities[0]}</li>
    <li>${result.opportunities[1]}</li>
  `;
  opportunityList.innerHTML = `
    <li>${result.opportunities[0]}</li>
    <li>${result.opportunities[1]}</li>
    <li>${result.opportunities[2]}</li>
  `;
}

async function loadLeaderboard() {
  try {
    const response = await fetch('/api/leaderboard');
    const data = await response.json();
    renderLeaderboard(data.leaderboard || []);
  } catch (error) {
    leaderboardEl.innerHTML = '<div class="leaderboard-item"><div><strong>Leaderboard unavailable</strong></div></div>';
  }
}

async function submitCV(event) {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = {
    name: formData.get('name'),
    role: formData.get('role'),
    experience: formData.get('experience'),
    skills: formData.get('skills'),
    education: formData.get('education'),
    location: formData.get('location'),
    industry: formData.get('industry'),
    cvSummary: formData.get('cvSummary')
  };

  formMessage.textContent = 'Analyzing your profile…';

  try {
    const response = await fetch('/api/score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    renderResult(data.result);
    formMessage.textContent = `${data.result.role} benchmark complete. Your profile is currently ranked in the ${data.result.band.toLowerCase()} band.`;
    renderLeaderboard(data.leaderboard || []);
  } catch (error) {
    formMessage.textContent = `Something went wrong: ${error.message}`;
  }
}

function loadSampleProfile() {
  updateFormValues(sampleProfile);
  form.requestSubmit();
}

form.addEventListener('submit', submitCV);
demoButton.addEventListener('click', loadSampleProfile);

loadLeaderboard();
loadSampleProfile();
