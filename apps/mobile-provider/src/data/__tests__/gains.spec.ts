import { filterGains, toGainsModel } from '../gains';
import type { CompletedMissionModel } from '../missions';

describe('gains', () => {
  const items: CompletedMissionModel[] = [
    {
      id: 'a',
      offerName: 'Complet',
      quartier: 'Lyon',
      netLabel: '77,60 € net',
      slotLabel: 'Aujourd’hui',
      durationLabel: '60 min',
      inProgress: false,
      completedAt: '2026-09-17T10:00:00.000Z',
      payout: 'pending',
    },
    {
      id: 'b',
      offerName: 'Extérieur',
      quartier: 'Lyon',
      netLabel: '32,00 € net',
      slotLabel: 'Hier',
      durationLabel: '45 min',
      inProgress: false,
      completedAt: '2026-08-01T10:00:00.000Z',
      payout: 'paid',
    },
  ];

  it('hero = solde en transit (nets pending), sans recalculer la commission', () => {
    const model = toGainsModel(items, new Date('2026-09-17T12:00:00.000Z'));
    expect(model.transitLabel).toBe('77,60 €');
    expect(model.items).toHaveLength(2);
  });

  it('filtre semaine vs tout, pas de camembert', () => {
    const now = new Date('2026-09-17T12:00:00.000Z');
    expect(filterGains(items, 'all', now)).toHaveLength(2);
    expect(filterGains(items, 'week', now).map((item) => item.id)).toEqual(['a']);
  });
});
