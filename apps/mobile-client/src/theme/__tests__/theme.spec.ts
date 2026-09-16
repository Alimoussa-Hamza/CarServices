import { theme } from '../theme';
import { colors } from '@carservice/ui-tokens';

describe('theme', () => {
  it('expose la marque CarWash via ui-tokens', () => {
    expect(theme.colors.brand.primary).toBe('#0D6E4F');
    expect(theme.colors).toBe(colors);
    expect(theme.radius.md).toBe(12);
  });
});
