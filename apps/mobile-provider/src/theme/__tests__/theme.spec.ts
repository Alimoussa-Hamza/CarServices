import { colors } from '@carservice/ui-tokens';
import { theme } from '../theme';

describe('pro theme', () => {
  it('applique Navy & Steel sans modifier les tokens client', () => {
    expect(theme.colors.brand.primary).toBe('#0B5FA5');
    expect(theme.colors.brand.secondary).toBe('#0B1F33');
    expect(theme.colors.neutral[100]).toBe('#F5F7FA');
    expect(colors.brand.primary).toBe('#0D6E4F');
  });
});
