import type React from 'react';

export type ThemeId =
  | 'classic'
  | 'royal-gold'
  | 'aurora'
  | 'midnight'
  | 'crimson'
  | 'emerald'
  | 'sterling'
  | 'restricted';

export type ThemeDef = {
  id: ThemeId;
  label: string;
  description: string;
  animated: boolean;
  coverClass: string;
  coverStyle?: React.CSSProperties;
  ringClass: string;
  avatarBorderClass: string;
  badgeClass: string;
  shimmerClass?: string;
};

export const THEMES: ThemeDef[] = [
  {
    id: 'classic',
    label: 'Classic Navy',
    description: 'Refined navy blue with a polished institutional finish',
    animated: true,
    coverClass: 'theme-classic-cover',
    ringClass: '',
    avatarBorderClass: 'border-white',
    badgeClass: 'bg-navy-800/90 text-white',
    shimmerClass: 'theme-classic-shimmer',
  },
  {
    id: 'royal-gold',
    label: 'Royal Gold',
    description: 'Luxurious burnished gold — for distinguished profiles',
    animated: true,
    coverClass: 'theme-royal-gold-cover',
    ringClass: 'ring-2 ring-amber-400/80',
    avatarBorderClass: 'border-amber-300',
    badgeClass: 'bg-amber-950/90 text-amber-100',
    shimmerClass: 'theme-royal-gold-shimmer',
  },
  {
    id: 'aurora',
    label: 'Aurora Borealis',
    description: 'Breathtaking animated northern lights gradient',
    animated: true,
    coverClass: 'theme-aurora-cover',
    ringClass: 'ring-2 ring-violet-400/70',
    avatarBorderClass: 'border-violet-300',
    badgeClass: 'bg-violet-950/90 text-violet-100',
    shimmerClass: 'theme-aurora-shimmer',
  },
  {
    id: 'midnight',
    label: 'Midnight Galaxy',
    description: 'Deep cosmos with drifting star particles',
    animated: true,
    coverClass: 'theme-midnight-cover',
    ringClass: 'ring-2 ring-blue-400/60',
    avatarBorderClass: 'border-blue-300',
    badgeClass: 'bg-blue-950/90 text-blue-100',
    shimmerClass: 'theme-midnight-stars',
  },
  {
    id: 'crimson',
    label: 'Crimson Prestige',
    description: 'Sophisticated deep burgundy with a velvet finish',
    animated: true,
    coverClass: 'theme-crimson-cover',
    ringClass: 'ring-2 ring-rose-400/70',
    avatarBorderClass: 'border-rose-300',
    badgeClass: 'bg-rose-950/90 text-rose-100',
    shimmerClass: 'theme-crimson-shimmer',
  },
  {
    id: 'emerald',
    label: 'Emerald Grove',
    description: 'Lush forest depth with rich jewel-toned accents',
    animated: true,
    coverClass: 'theme-emerald-cover',
    ringClass: 'ring-2 ring-emerald-400/70',
    avatarBorderClass: 'border-emerald-300',
    badgeClass: 'bg-emerald-950/90 text-emerald-100',
    shimmerClass: 'theme-emerald-shimmer',
  },
  {
    id: 'sterling',
    label: 'Sterling Finance',
    description: 'Premium teal-slate — the mark of financial authority',
    animated: true,
    coverClass: 'theme-sterling-cover',
    ringClass: 'ring-2 ring-teal-400/70',
    avatarBorderClass: 'border-teal-300',
    badgeClass: 'bg-teal-950/90 text-teal-100',
    shimmerClass: 'theme-sterling-shimmer',
  },
  {
    id: 'restricted',
    label: 'Restricted',
    description: 'Institutional charcoal — account access restricted',
    animated: true,
    coverClass: 'theme-restricted-cover',
    ringClass: 'ring-2 ring-red-900',
    avatarBorderClass: 'border-slate-700',
    badgeClass: 'bg-slate-900/90 text-slate-300',
    shimmerClass: 'theme-restricted-pulse',
  },
];

export function getTheme(themeId: string | null | undefined): ThemeDef {
  return THEMES.find((t) => t.id === themeId) ?? THEMES[0];
}
