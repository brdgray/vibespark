/** Shared lists for research demographics — profile, signup, and onboarding must stay in sync. */

export const AGE_RANGES = ['under-18', '18-24', '25-34', '35-44', '45-54', '55+'] as const

export const PROFESSIONS = [
  'Software Engineer / Developer',
  'Product Manager',
  'UX / UI Designer',
  'Data Scientist / Analyst',
  'Marketing / Growth',
  'Sales / Business Development',
  'Entrepreneur / Founder',
  'Investor / VC',
  'Operations / Finance',
  'Researcher / Academic',
  'Student',
  'Other',
] as const

export const INDUSTRIES = [
  'Artificial Intelligence / ML',
  'Technology / Software (SaaS)',
  'Fintech / Finance',
  'Healthcare / Biotech',
  'E-commerce / Retail',
  'Education / EdTech',
  'Real Estate / PropTech',
  'Media / Entertainment',
  'Legal / LegalTech',
  'HR / Recruiting',
  'Logistics / Supply Chain',
  'Climate / CleanTech',
  'Food / AgriTech',
  'Gaming',
  'Cybersecurity',
  'Consumer / Lifestyle',
  'Other',
] as const

export const PERSONA_OPTIONS = [
  { key: 'founder', label: '🚀 Founder' },
  { key: 'investor', label: '💼 Investor' },
  { key: 'engineer', label: '⚙️ Engineer / Dev' },
  { key: 'designer', label: '🎨 Designer' },
  { key: 'pm', label: '📋 Product Manager' },
  { key: 'marketing', label: '📣 Marketing / Growth' },
  { key: 'student', label: '🎓 Student' },
  { key: 'consumer', label: '👤 Consumer / User' },
  { key: 'researcher', label: '🔬 Researcher' },
] as const

export type PersonaKey = (typeof PERSONA_OPTIONS)[number]['key']

export const TECH_LEVELS = ['non-technical', 'basic', 'intermediate', 'advanced'] as const
