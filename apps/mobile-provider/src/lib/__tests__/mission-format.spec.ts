import {
  detectNewMissions,
  formatDurationLabel,
  formatNetEur,
  formatSlotLabel,
  quartierLabel,
} from '../mission-format';

describe('mission-format', () => {
  it('affiche le net via le split partagé, pas un taux local', () => {
    expect(formatNetEur(9700)).toBe('77,60 € net');
  });

  it('n’utilise que le nom de zone comme quartier', () => {
    expect(quartierLabel('Lyon 3e — Part-Dieu')).toBe('Lyon 3e — Part-Dieu');
    expect(quartierLabel('Lyon')).toBe('Lyon');
  });

  it('formate créneau et durée', () => {
    const start = new Date();
    start.setHours(14, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    expect(formatSlotLabel(start.toISOString(), start)).toMatch(/^Aujourd'hui, 14h00$/);
    expect(formatDurationLabel(start.toISOString(), end.toISOString())).toBe(
      '60 min',
    );
  });

  it('détecte une nouvelle mission pour le toast 4 s', () => {
    expect(detectNewMissions(['a'], ['a', 'b'])).toBe(true);
    expect(detectNewMissions(['a', 'b'], ['a', 'b'])).toBe(false);
  });
});
