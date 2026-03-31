import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PWA_INSTALL_SNOOZE_KEY,
  isStandaloneDisplay,
  isSnoozed,
  readSnoozeUntil,
  isLikelyIosSafari,
} from '../src/lib/pwaInstall.js';

describe('pwaInstall helpers', () => {
  describe('isStandaloneDisplay', () => {
    it('retorna false sem window', () => {
      expect(isStandaloneDisplay(null)).toBe(false);
    });

    it('retorna true quando display-mode standalone', () => {
      const win = {
        matchMedia: (q) => ({
          matches: q === '(display-mode: standalone)',
        }),
        navigator: {},
      };
      expect(isStandaloneDisplay(win)).toBe(true);
    });

    it('retorna true quando navigator.standalone (iOS)', () => {
      const win = {
        matchMedia: () => ({ matches: false }),
        navigator: { standalone: true },
      };
      expect(isStandaloneDisplay(win)).toBe(true);
    });
  });

  describe('isSnoozed', () => {
    it('retorna false quando snoozeUntil é null', () => {
      expect(isSnoozed(1000, null)).toBe(false);
    });

    it('retorna true quando agora < snoozeUntil', () => {
      expect(isSnoozed(1000, 2000)).toBe(true);
    });

    it('retorna false quando agora >= snoozeUntil', () => {
      expect(isSnoozed(3000, 2000)).toBe(false);
    });
  });

  describe('readSnoozeUntil', () => {
    beforeEach(() => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      });
    });

    it('lê timestamp válido', () => {
      const storage = { getItem: () => '1700000000000' };
      expect(readSnoozeUntil(storage)).toBe(1700000000000);
    });

    it('retorna null para valor inválido', () => {
      expect(readSnoozeUntil({ getItem: () => 'abc' })).toBe(null);
    });
  });

  describe('isLikelyIosSafari', () => {
    it('detecta iPhone', () => {
      expect(isLikelyIosSafari('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe(true);
    });

    it('retorna false para desktop típico', () => {
      expect(isLikelyIosSafari('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(false);
    });
  });

  it('PWA_INSTALL_SNOOZE_KEY é estável', () => {
    expect(PWA_INSTALL_SNOOZE_KEY).toBe('onbible_pwa_install_snooze_until');
  });
});
