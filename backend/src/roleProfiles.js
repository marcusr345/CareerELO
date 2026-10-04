export const ROLE_PROFILES = {
  'Software Engineer': {
    skills: ['javascript', 'python', 'typescript', 'sql', 'aws', 'react', 'node', 'system design'],
    baseElo: 1480,
    emphasis: 'Strong engineering fundamentals, shipping production code, and system-level thinking.'
  },
  'Product Manager': {
    skills: ['strategy', 'roadmaps', 'analytics', 'stakeholder management', 'sql', 'user research'],
    baseElo: 1460,
    emphasis: 'Prioritisation, business context, and measurable product outcomes.'
  },
  'Data Analyst': {
    skills: ['python', 'sql', 'excel', 'statistics', 'dashboards', 'tableau'],
    baseElo: 1470,
    emphasis: 'Analytical thinking, reporting quality, and business insight generation.'
  },
  'UX Designer': {
    skills: ['figma', 'research', 'wireframing', 'prototyping', 'design systems', 'ux writing'],
    baseElo: 1455,
    emphasis: 'User-centred design process and polished, testable interfaces.'
  },
  Sales: {
    skills: ['crm', 'prospecting', 'pipeline', 'negotiation', 'account management', 'cold outreach'],
    baseElo: 1435,
    emphasis: 'Revenue generation, relationship building, and quota attainment.'
  }
};

export const ROLE_ALIASES = {
  'Backend Engineer': 'Software Engineer',
  'Frontend Engineer': 'Software Engineer',
  'Platform Engineer': 'Software Engineer',
  'SWE Intern': 'Software Engineer',
  'Software Engineering Intern': 'Software Engineer',
  'QA Engineer': 'Software Engineer',
  'DevOps Engineer': 'Software Engineer',
  'Data Scientist': 'Data Analyst',
  'Business Analyst': 'Data Analyst',
  PM: 'Product Manager',
  'Product Management Intern': 'Product Manager',
  'UX Researcher': 'UX Designer',
  'Product Designer': 'UX Designer',
  'Sales Executive': 'Sales',
  'Sales Intern': 'Sales'
};

export function canonicalRole(role) {
  return ROLE_ALIASES[role] || role;
}
