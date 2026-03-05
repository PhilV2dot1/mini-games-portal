import { describe, test, expect } from 'vitest';
import {
  colors,
  chainThemes,
  getChainShadow,
  getChainGradient,
  getCeloShadow,
  type ChainThemeName,
} from '@/lib/constants/design-tokens';

describe('Design Tokens - Chain Theming', () => {
  describe('colors', () => {
    test('should have celo brand colors', () => {
      expect(colors.celo).toBe('#FCFF52');
      expect(colors.celoHover).toBe('#e5e600');
      expect(colors.celoLight).toBe('#feff7a');
      expect(colors.celoDark).toBe('#d4d600');
    });

    test('should have base brand colors', () => {
      expect(colors.base).toBe('#0052FF');
      expect(colors.baseHover).toBe('#003ecc');
      expect(colors.baseLight).toBe('#3373ff');
      expect(colors.baseDark).toBe('#0040cc');
    });
  });

  describe('chainThemes', () => {
    test('should have celo and base themes', () => {
      expect(chainThemes.celo).toBeDefined();
      expect(chainThemes.base).toBeDefined();
    });

    test('celo theme should match celo colors', () => {
      expect(chainThemes.celo.primary).toBe(colors.celo);
      expect(chainThemes.celo.hover).toBe(colors.celoHover);
      expect(chainThemes.celo.light).toBe(colors.celoLight);
      expect(chainThemes.celo.dark).toBe(colors.celoDark);
    });

    test('base theme should match base colors', () => {
      expect(chainThemes.base.primary).toBe(colors.base);
      expect(chainThemes.base.hover).toBe(colors.baseHover);
      expect(chainThemes.base.light).toBe(colors.baseLight);
      expect(chainThemes.base.dark).toBe(colors.baseDark);
    });

    test('celo theme should have dark contrast text', () => {
      expect(chainThemes.celo.contrastText).toBe('#111827');
    });

    test('base theme should have white contrast text', () => {
      expect(chainThemes.base.contrastText).toBe('#ffffff');
    });

    test('both themes should have all required properties', () => {
      const requiredKeys = ['primary', 'hover', 'light', 'dark', 'contrastText'];
      (['celo', 'base'] as ChainThemeName[]).forEach(chain => {
        requiredKeys.forEach(key => {
          expect(chainThemes[chain]).toHaveProperty(key);
          expect(typeof chainThemes[chain][key as keyof typeof chainThemes.celo]).toBe('string');
        });
      });
    });
  });

  describe('getChainShadow', () => {
    test('should return shadow with celo color', () => {
      const shadow = getChainShadow('celo');
      expect(shadow).toContain('#FCFF52');
    });

    test('should return shadow with base color', () => {
      const shadow = getChainShadow('base');
      expect(shadow).toContain('#0052FF');
    });

    test('should respect size parameter', () => {
      const sm = getChainShadow('celo', 'sm');
      const xl = getChainShadow('celo', 'xl');
      expect(sm).toContain('2px');
      expect(xl).toContain('6px');
    });

    test('should default to md size', () => {
      const md = getChainShadow('celo');
      expect(md).toContain('3px');
    });
  });

  describe('getChainGradient', () => {
    test('should return gradient with celo colors', () => {
      const gradient = getChainGradient('celo');
      expect(gradient).toContain(colors.celoLight);
      expect(gradient).toContain(colors.celo);
      expect(gradient).toContain(colors.celoDark);
    });

    test('should return gradient with base colors', () => {
      const gradient = getChainGradient('base');
      expect(gradient).toContain(colors.baseLight);
      expect(gradient).toContain(colors.base);
      expect(gradient).toContain(colors.baseDark);
    });

    test('should return valid CSS gradient string', () => {
      const gradient = getChainGradient('celo');
      expect(gradient).toMatch(/^linear-gradient\(/);
    });
  });

  describe('getCeloShadow (backward compat)', () => {
    test('should still work for celo-specific shadows', () => {
      const shadow = getCeloShadow();
      expect(shadow).toContain('#FCFF52');
    });
  });
});
