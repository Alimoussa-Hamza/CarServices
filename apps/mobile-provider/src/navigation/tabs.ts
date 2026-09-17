/** Bottom tabs after KYC + Connect (S02/S03 will gate). Labels match UX Pilot. */
export const PRO_TABS = [
  { name: 'missions', label: 'Missions' },
  { name: 'planning', label: 'Planning' },
  { name: 'gains', label: 'Gains' },
  { name: 'profil', label: 'Profil' },
] as const;

export type ProTabName = (typeof PRO_TABS)[number]['name'];

export const PRO_TAB_LABELS: readonly string[] = PRO_TABS.map((tab) => tab.label);
