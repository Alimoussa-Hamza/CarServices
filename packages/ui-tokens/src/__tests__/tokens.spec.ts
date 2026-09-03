import { colors, radius, spacing, typography } from '../index';

describe('ui-tokens', () => {
  describe('colors', () => {
    it('expose les couleurs de marque principales', () => {
      expect(colors.brand.primary).toBe('#0D6E4F');
      expect(colors.brand.secondary).toBe('#1A3A5C');
      expect(colors.brand.accent).toBe('#F5A623');
    });

    it('expose une échelle neutre du blanc au texte principal', () => {
      expect(colors.neutral[0]).toBe('#FFFFFF');
      expect(colors.neutral[100]).toBe('#F4F4F8');
      expect(colors.neutral[900]).toBe('#1A1A2E');
    });

    it('utilise uniquement des couleurs hexadécimales', () => {
      const allColors = [
        ...Object.values(colors.brand),
        ...Object.values(colors.neutral),
        ...Object.values(colors.semantic),
      ];

      expect(allColors).toHaveLength(15);
      expect(allColors.every((color) => /^#[0-9A-F]{6}$/.test(color))).toBe(
        true,
      );
    });
  });

  describe('spacing', () => {
    it('garde une échelle croissante pour éviter les incohérences UI', () => {
      const values = Object.values(spacing);

      expect(values).toEqual([...values].sort((a, b) => a - b));
    });

    it('contient les tailles utilisées par les apps mobiles actuelles', () => {
      expect(spacing[3]).toBe(8);
      expect(spacing[7]).toBe(24);
      expect(spacing[8]).toBe(32);
    });
  });

  describe('radius', () => {
    it('expose les rayons standard', () => {
      expect(radius).toMatchObject({
        sm: 8,
        md: 12,
        lg: 16,
        full: 999,
      });
    });

    it('garde full supérieur aux rayons cartes', () => {
      expect(radius.full).toBeGreaterThan(radius.lg);
    });
  });

  describe('typography', () => {
    it('définit Inter comme police produit principale avec fallback système', () => {
      expect(typography.fontFamily.sans).toContain('Inter');
      expect(typography.fontFamily.sans).toContain('system-ui');
    });
  });
});
