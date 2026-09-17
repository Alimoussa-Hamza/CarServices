import { PRO_TAB_LABELS, PRO_TABS } from '../../navigation/tabs';

describe('PRO_TABS', () => {
  it('expose les 4 onglets FR du cahier M12 (pas Accueil / Réservations)', () => {
    expect(PRO_TAB_LABELS).toEqual(['Missions', 'Planning', 'Gains', 'Profil']);
    expect(PRO_TABS.map((t) => t.name)).toEqual([
      'missions',
      'planning',
      'gains',
      'profil',
    ]);
  });
});
