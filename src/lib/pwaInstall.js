/** Utilitários para o banner de instalação PWA (testáveis sem React). */

export const PWA_INSTALL_SNOOZE_KEY = 'onbible_pwa_install_snooze_until';

/** ~14 dias em ms */
export const PWA_INSTALL_SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * @param {Window | null} win
 * @returns {boolean}
 */
export function isStandaloneDisplay(win) {
  const w = win ?? (typeof window !== 'undefined' ? window : null);
  if (!w) return false;
  try {
    if (w.matchMedia('(display-mode: standalone)').matches) return true;
    if (w.matchMedia('(display-mode: minimal-ui)').matches) return true;
  } catch {
    /* matchMedia pode falhar em ambientes estranhos */
  }
  if (w.navigator && w.navigator.standalone === true) return true;
  return false;
}

/**
 * @param {number} nowMs
 * @param {number | null} snoozeUntilMs
 */
export function isSnoozed(nowMs, snoozeUntilMs) {
  if (snoozeUntilMs == null || Number.isNaN(snoozeUntilMs)) return false;
  return nowMs < snoozeUntilMs;
}

/**
 * @param {Storage | null} storage
 * @returns {number | null}
 */
export function readSnoozeUntil(storage) {
  if (!storage) return null;
  const raw = storage.getItem(PWA_INSTALL_SNOOZE_KEY);
  if (raw == null) return null;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}

/**
 * @param {string} [ua]
 */
export function isLikelyIosSafari(ua) {
  const u = ua ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  if (/iPad|iPhone|iPod/i.test(u)) return true;
  if (
    typeof navigator !== 'undefined' &&
    navigator.platform === 'MacIntel' &&
    navigator.maxTouchPoints > 1
  ) {
    return true;
  }
  return false;
}
