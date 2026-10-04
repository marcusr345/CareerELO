import { ROLE_PROFILES, canonicalRole } from './roleProfiles.js';

const IMPACT_MARKERS = [
  'led',
  'improved',
  'increased',
  'reduced',
  'launched',
  'built',
  'scaled',
  'delivered',
  'owned',
  'optimized',
  'boosted',
  'revenue',
  'retention',
  'growth'
];

const EDUCATION_POINTS = {
  PhD: 15,
  "Master's": 14,
  "Bachelor's": 12,
  Diploma: 9,
  Bootcamp: 9,
  'High School': 7,
  default: 8
};

const ROLE_DIFFICULTY = {
  'Software Engineer': 1.1,
  'Product Manager': 1.05,
  'Data Analyst': 1.08,
  'UX Designer': 1.0,
  Sales: 0.96
};

const ROLE_PREDICTIONS = {
  'Software Engineer': {
    nextTitle: 'Senior Software Engineer',
    adjacent: ['Backend Engineer', 'Frontend Engineer', 'Platform Engineer']
  },
  'Product Manager': {
    nextTitle: 'Senior Product Manager',
    adjacent: ['Growth PM', 'Technical PM', 'Strategy PM']
  },
  'Data Analyst': {
    nextTitle: 'Senior Data Analyst',
    adjacent: ['Analytics Manager', 'BI Analyst', 'Data Scientist']
  },
  'UX Designer': {
    nextTitle: 'Senior UX Designer',
    adjacent: ['Product Designer', 'Design Systems Designer', 'UX Researcher']
  },
  Sales: {
    nextTitle: 'Senior Sales Executive',
    adjacent: ['Account Executive', 'Business Development Manager', 'Revenue Manager']
  }
};

const SKILL_ALIASES = {
  'node.js': 'node',
  'product strategy': 'strategy',
  roadmapping: 'roadmaps'
};

export function normalizeSkill(skill) {
  const normalized = String(skill || '').trim().toLowerCase();
  return SKILL_ALIASES[normalized] || normalized;
}

export function parseSkills(rawSkills = '') {
  return String(rawSkills)
    .split(',')
    .map((skill) => normalizeSkill(skill))
    .filter(Boolean);
}

export function extractCvSignals(cvText = '') {
  const text = String(cvText || '').toLowerCase();
  const words = Array.from(new Set(text.match(/[a-z0-9+#.-]{3,}/g) || []));
  const impactCount = IMPACT_MARKERS.reduce((count, marker) => {
    return text.includes(marker) ? count + 1 : count;
  }, 0);

  return {
    text,
    words,
    impactCount
  };
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getRoleProfile(role) {
  const profile = ROLE_PROFILES[canonicalRole(role)];
  if (!profile) {
    throw new Error(`Unknown role: ${role}`);
  }
  return profile;
}

export function calculateRoleMatch(roleSkills = [], targetSkills = []) {
  const uniqueTarget = new Set(targetSkills.map((skill) => normalizeSkill(skill)));
  const matches = roleSkills.filter((skill) => uniqueTarget.has(normalizeSkill(skill)));
  return Math.round((matches.length / Math.max(targetSkills.length, 1)) * 100);
}

export function computeImpactDensity(cvText = '') {
  const text = String(cvText || '').toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const matches = IMPACT_MARKERS.filter((marker) => text.includes(marker));
  const density = (matches.length / Math.max(words.length, 1)) * 100;
  return Number(density.toFixed(2));
}

export function computeSkillHeatmap(parsedSkills = [], roleSkills = []) {
  const roleSet = new Set(roleSkills.map(normalizeSkill));
  const cvSet = new Set(parsedSkills.map(normalizeSkill));

  const strong = [...roleSet].filter((skill) => cvSet.has(skill));
  const weak = [...cvSet]
    .filter((skill) => !roleSet.has(skill))
    .slice(0, 6);
  const missing = [...roleSet]
    .filter((skill) => !cvSet.has(skill))
    .slice(0, 6);

  return { strong, weak, missing };
}

export function extractJobDescriptionKeywords(jobDescription = '') {
  const text = String(jobDescription || '').toLowerCase();
  const words = text.match(/[a-z0-9+#.-]{3,}/g) || [];
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'from', 'your', 'into', 'that', 'this', 'have', 'will', 'work', 'team', 'role', 'about'
  ]);

  const unique = [...new Set(words.filter((word) => !stopWords.has(word)))];
  return unique;
}

export function computeJdFit(cvText = '', jobDescription = '', roleSkills = []) {
  const cvWords = new Set((String(cvText || '').toLowerCase().match(/[a-z0-9+#.-]{3,}/g) || []).filter(Boolean));
  const jdWords = extractJobDescriptionKeywords(jobDescription);
  const strong = jdWords.filter((word) => cvWords.has(word)).slice(0, 10);
  const missing = jdWords.filter((word) => !cvWords.has(word)).slice(0, 10);

  const profileWords = roleSkills.map(normalizeSkill);
  const roleKeywords = profileWords.filter((word) => !cvWords.has(word)).slice(0, 5);

  const fitScore = jdWords.length
    ? Math.round((strong.length / Math.max(jdWords.length, 1)) * 100)
    : Math.round((profileWords.filter((word) => cvWords.has(word)).length / Math.max(profileWords.length, 1)) * 100);

  return {
    fitScore,
    strong,
    missing: missing.length ? missing : roleKeywords,
    jdKeywords: jdWords.slice(0, 12)
  };
}

export function computeEloVolatility(history = []) {
  const points = (history || []).map((entry) => Number(entry.elo || 0));
  if (points.length < 2) return 0;

  let deltas = [];
  for (let index = 1; index < points.length; index += 1) {
    deltas.push(Math.abs(points[index] - points[index - 1]));
  }

  const mean = deltas.reduce((sum, value) => sum + value, 0) / Math.max(deltas.length, 1);
  return Number(mean.toFixed(2));
}

export function computeEloStreak(history = []) {
  const points = (history || []).map((entry) => Number(entry.elo || 0));
  if (points.length < 2) return { direction: 'plateau', strength: 0 };

  const deltas = [];
  for (let index = 1; index < points.length; index += 1) {
    deltas.push(points[index] - points[index - 1]);
  }

  const recent = deltas.slice(-5);
  const positive = recent.filter((delta) => delta > 0).length;
  const negative = recent.filter((delta) => delta < 0).length;
  const zero = recent.filter((delta) => delta === 0).length;

  if (positive > negative && positive >= 2) return { direction: 'upward', strength: positive - negative };
  if (negative > positive && negative >= 2) return { direction: 'downward', strength: negative - positive };
  return { direction: 'plateau', strength: zero || Math.abs(positive - negative) };
}

export function computeRoleDifficulty(role) {
  return ROLE_DIFFICULTY[canonicalRole(role)] || 1;
}

const CAREER_LEVELS = [
  { name: 'student', floor: 1200, base: 1320, ceiling: 1500 },
  { name: 'intern', floor: 1250, base: 1370, ceiling: 1530 },
  { name: 'junior', floor: 1350, base: 1480, ceiling: 1660 },
  { name: 'mid-level', floor: 1500, base: 1630, ceiling: 1820 },
  { name: 'senior', floor: 1650, base: 1790, ceiling: 2020 },
  { name: 'executive', floor: 1850, base: 2020, ceiling: 2280 },
  { name: 'public-figure', floor: 2150, base: 2320, ceiling: 2600 }
];

const HIGH_PRESTIGE_TITLES = /\b(head of state|president|prime minister|ceo|chief executive officer|founder|executive|director)\b/i;
const LEADERSHIP_SIGNALS = /\b(led|managed|directed|founded|owned|mentored|hired|built a team|team of \d+)\b/gi;
const SCOPE_SIGNALS = /\b(global|international|company-wide|enterprise|multi-team|organization-wide|across \d+ teams|budget of|users|customers)\b/gi;
const MEASURABLE_SIGNALS = /\b\d+(?:\.\d+)?\s*(?:%|percent|million|billion|k|m|users|customers|teams|people|hours|days|revenue)\b/gi;

export function inferCareerLevel({ experience = 0, title = '' } = {}) {
  const normalizedTitle = String(title || '').toLowerCase();
  if (HIGH_PRESTIGE_TITLES.test(normalizedTitle)) return 'public-figure';
  if (/\b(chief|ceo|cto|cfo|coo|president|vice president|vp|executive)\b/.test(normalizedTitle)) return 'executive';
  if (/\b(director|head of|senior|staff|principal|lead)\b/.test(normalizedTitle)) return 'senior';
  if (/\b(intern|internship|placement)\b/.test(normalizedTitle)) return 'intern';
  if (/\b(student|graduate|undergraduate)\b/.test(normalizedTitle)) return 'student';

  const years = Number(experience) || 0;
  if (years >= 8) return 'senior';
  if (years >= 4) return 'mid-level';
  if (years >= 1) return 'junior';
  return 'student';
}

export function calculateGlobalElo({
  cvText = '',
  skills = '',
  experience = 0,
  title = '',
  impactDensity = 0,
  education = '',
  certifications = ''
} = {}) {
  const text = String(cvText || '');
  const level = inferCareerLevel({ experience, title });
  const levelConfig = CAREER_LEVELS.find((item) => item.name === level) || CAREER_LEVELS[0];
  const leadershipCount = (text.match(LEADERSHIP_SIGNALS) || []).length;
  const scopeCount = (text.match(SCOPE_SIGNALS) || []).length;
  const measurableCount = (text.match(MEASURABLE_SIGNALS) || []).length;
  const uniqueSkills = [...new Set(parseSkills(skills))];
  const skillRarity = uniqueSkills.reduce((sum, skill) => {
    const appearances = Object.values(ROLE_PROFILES).filter((profile) =>
      profile.skills.some((profileSkill) => normalizeSkill(profileSkill) === skill)
    ).length;
    return sum + (appearances === 1 ? 5 : appearances === 2 ? 3 : appearances > 2 ? 1 : 0);
  }, 0);
  const leadership = Math.min(leadershipCount * 12, 48);
  const scope = Math.min(scopeCount * 8, 32);
  const measurable = Math.min(measurableCount * 7, 35);
  const impact = clamp(Number(impactDensity) * 0.6, 0, 30);
  const rarity = Math.min(skillRarity, 40);
  const educationLevel = EDUCATION_POINTS[education] ?? EDUCATION_POINTS.default;
  const educationStrength = Math.max(0, (educationLevel - 7) * 1.5);
  const certificationCount = String(certifications || '').split(/[,\n]+/).map((item) => item.trim()).filter(Boolean).length;
  const certificationStrength = Math.min(certificationCount * 5, 20);
  const raw = levelConfig.base + leadership + scope + measurable + impact + rarity +
    educationStrength + certificationStrength;
  const elo = clamp(Math.round(raw), levelConfig.floor, levelConfig.ceiling);

  return {
    elo,
    level,
    range: { min: levelConfig.floor, max: levelConfig.ceiling },
    signals: {
      leadership: leadershipCount,
      scope: scopeCount,
      measurableAchievements: measurableCount,
      skillRarity: rarity,
      educationStrength,
      certificationStrength,
      impactDensity: Number(impactDensity) || 0
    }
  };
}

export function calculatePercentile(elo, records = [], field = 'globalElo') {
  const value = Number(elo);
  const fieldAliases = {
    globalElo: ['generalElo', 'general_elo', 'global_elo'],
    generalElo: ['globalElo', 'general_elo', 'global_elo']
  };
  const peers = records.map((record) => {
    const value = record[field] ?? fieldAliases[field]?.map((alias) => record[alias]).find((candidate) => candidate != null);
    return Number(value);
  }).filter(Number.isFinite);

  if (!Number.isFinite(value)) return { percentile: null, sampleSize: peers.length };
  if (!peers.length) return { percentile: null, sampleSize: 0 };

  const below = peers.filter((peer) => peer < value).length;
  const equal = peers.filter((peer) => peer === value).length;
  return {
    percentile: Math.max(1, Math.min(99, Math.round(((below + equal * 0.5) / peers.length) * 100))),
    sampleSize: peers.length
  };
}

export function buildPrestigeTitles({
  globalPercentile,
  ageGroupPercentile,
  globalSampleSize = 0,
  ageGroupSampleSize = 0,
  ageGroup
}) {
  const titles = [];
  if (globalSampleSize >= 100 && globalPercentile != null && globalPercentile >= 99) titles.push('Global Top 1%');
  else if (globalSampleSize >= 100 && globalPercentile != null && globalPercentile >= 90) titles.push('Global Top 10%');

  if (ageGroupSampleSize >= 30 && ageGroup && ageGroupPercentile != null && ageGroupPercentile >= 80) {
    titles.push(`Top 20% Career ELO · age ${ageGroup}`);
  }
  return titles;
}

export function calculateCareerEloHistory(currentElo, previousHistory = []) {
  const history = Array.isArray(previousHistory) ? previousHistory : [];
  const timestamp = new Date().toISOString();

  const prior = history.length
    ? history[history.length - 1].elo
    : Math.max(1200, currentElo - 30);

  const nextHistory = [...history, { timestamp, elo: currentElo, delta: currentElo - prior }];
  return nextHistory.slice(-8);
}

export function predictNextRole(role, experience, skills = []) {
  const canonical = canonicalRole(role);
  const mapping = ROLE_PREDICTIONS[canonical] || { nextTitle: 'Senior Specialist', adjacent: ['Senior Specialist', 'Lead Role'] };
  const skillCount = parseSkills(skills).length;
  const seniorityBoost = experience >= 6;

  return {
    nextTitle: seniorityBoost ? mapping.nextTitle : `Associate ${role}`,
    adjacentRoles: mapping.adjacent,
    growthSignal: skillCount >= 5 ? 'High momentum' : 'Moderate momentum'
  };
}

export function predictGrowthCurve(history = []) {
  const points = (history || []).map((entry) => Number(entry.elo || 0));
  if (points.length < 2) {
    return { slope: 0, direction: 'stable' };
  }

  const start = points[0];
  const end = points[points.length - 1];
  const slope = end - start;

  if (slope > 70) return { slope, direction: 'accelerating' };
  if (slope > 0) return { slope, direction: 'upward' };
  if (slope < -70) return { slope, direction: 'declining' };
  return { slope, direction: 'stable' };
}

export function scoreCv({
  cvText = '',
  role,
  experience = 0,
  skills = '',
  education = '',
  jobDescription = ''
}) {
  const profile = getRoleProfile(role);
  const parsedSkills = parseSkills(skills);
  const matchedSkills = parsedSkills.filter((skill) => profile.skills.includes(skill));
  const roleMatch = Math.round((matchedSkills.length / Math.max(profile.skills.length, 1)) * 100);

  const experienceValue = Number(experience) || 0;
  const experiencePoints = clamp(
    (Math.min(experienceValue, 3) * 2.6) + Math.max(experienceValue - 3, 0) * 0.9,
    0,
    18
  );
  const roleSkillPoints = clamp((matchedSkills.length / Math.max(profile.skills.length, 1)) * 36, 0, 36);
  const educationPoints = EDUCATION_POINTS[education] ?? EDUCATION_POINTS.default;
  const { impactCount } = extractCvSignals(cvText);
  const impactPoints = clamp(impactCount * 4, 0, 18);
  const impactDensity = computeImpactDensity(cvText);
  const skillHeatmap = computeSkillHeatmap(parsedSkills, profile.skills);
  const jdFit = computeJdFit(cvText, jobDescription, profile.skills);
  const cvScore = clamp(experiencePoints + roleSkillPoints + educationPoints + impactPoints, 0, 100);
  const evidenceScore = clamp(impactPoints / 18 * 100, 0, 100);
  const applicationScore = Math.round(
    cvScore * 0.35 +
    roleMatch * 0.3 +
    jdFit.fitScore * 0.25 +
    evidenceScore * 0.1
  );

  return {
    role,
    score: applicationScore,
    applicationScore,
    cvScore: Number(cvScore.toFixed(1)),
    roleMatch,
    matchedSkills: matchedSkills.slice(0, 5),
    emphasis: profile.emphasis,
    skillMatchCount: matchedSkills.length,
    profileSkillCount: profile.skills.length,
    educationPoints,
    impactPoints,
    experiencePoints,
    roleSkillPoints,
    impactDensity,
    skillHeatmap,
    jdFit,
    prediction: predictNextRole(role, Number(experience) || 0, parsedSkills)
  };
}

export function buildInsights({ role, score, percentile, roleMatch, emphasis, jdFit, skillHeatmap }) {
  const profile = getRoleProfile(role);

  let summary = 'Your CV has solid potential but needs sharper positioning.';
  if (percentile >= 80) summary = 'Excellent competitive positioning for this role.';
  else if (percentile >= 60) summary = 'Strong candidate signal with room to sharpen a few areas.';
  else if (percentile >= 40) summary = 'You are in a competitive range, with clear growth opportunities.';

  const bullets = [
    `Role emphasis: ${profile.emphasis}`,
    roleMatch >= 70
      ? 'Your skill alignment is strong and should be surfaced more directly in the CV.'
      : 'Increase keyword alignment with role-specific tools, responsibilities, and frameworks.',
    jdFit && jdFit.missing?.length
      ? `JD-fit gap: missing keywords like ${jdFit.missing.slice(0, 3).join(', ')}.`
      : 'JD-fit is in good alignment with the target role.',
    skillHeatmap && skillHeatmap.missing?.length
      ? `Focus on these missing skills: ${skillHeatmap.missing.slice(0, 3).join(', ')}.`
      : 'Core skill strengths are well covered in your CV.'
  ];

  return {
    summary,
    bullets,
    percentileBand:
      percentile >= 80 ? 'Top 20%' : percentile >= 60 ? 'Above average' : percentile >= 40 ? 'Competitive range' : 'Needs sharper positioning',
    emphasis
  };
}
