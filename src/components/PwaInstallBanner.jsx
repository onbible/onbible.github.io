import { useState, useEffect, useRef, useCallback } from 'react';
import {
  PWA_INSTALL_SNOOZE_KEY,
  PWA_INSTALL_SNOOZE_MS,
  isStandaloneDisplay,
  isSnoozed,
  readSnoozeUntil,
  isLikelyIosSafari,
} from '../lib/pwaInstall.js';

const COMPLETED_KEY = 'onbible_pwa_install_completed';

/**
 * Banner fixo para convidar à instalação PWA (Chromium: botão nativo; iOS: instruções).
 * @param {{ onVisibilityChange?: (visible: boolean) => void }} props
 */
export default function PwaInstallBanner({ onVisibilityChange }) {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState('none'); // 'chrome' | 'ios'
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const rootRef = useRef(null);
  const iosTimerRef = useRef(null);
  const bipFiredRef = useRef(false);

  const hide = useCallback(() => {
    setVisible(false);
    setDeferredPrompt(null);
    setMode('none');
  }, []);

  const dismiss = useCallback(() => {
    try {
      const until = Date.now() + PWA_INSTALL_SNOOZE_MS;
      localStorage.setItem(PWA_INSTALL_SNOOZE_KEY, String(until));
    } catch {
      /* ignore */
    }
    hide();
  }, [hide]);

  useEffect(() => {
    onVisibilityChange?.(visible);
  }, [visible, onVisibilityChange]);

  useEffect(() => {
    if (!visible || !rootRef.current) {
      document.documentElement.style.removeProperty('--pwa-banner-height');
      return undefined;
    }
    const el = rootRef.current;
    const apply = () => {
      document.documentElement.style.setProperty('--pwa-banner-height', `${el.offsetHeight}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--pwa-banner-height');
    };
  }, [visible]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    try {
      if (localStorage.getItem(COMPLETED_KEY) === '1') return undefined;
    } catch {
      /* ignore */
    }

    if (isStandaloneDisplay()) return undefined;

    const until = readSnoozeUntil(localStorage);
    if (isSnoozed(Date.now(), until)) return undefined;

    const onBip = (e) => {
      e.preventDefault();
      bipFiredRef.current = true;
      setDeferredPrompt(e);
      setMode('chrome');
      setVisible(true);
      if (iosTimerRef.current) {
        clearTimeout(iosTimerRef.current);
        iosTimerRef.current = null;
      }
    };

    const onInstalled = () => {
      try {
        localStorage.setItem(COMPLETED_KEY, '1');
      } catch {
        /* ignore */
      }
      hide();
    };

    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);

    if (isLikelyIosSafari()) {
      iosTimerRef.current = window.setTimeout(() => {
        if (bipFiredRef.current) return;
        setMode('ios');
        setVisible(true);
      }, 800);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onInstalled);
      if (iosTimerRef.current) clearTimeout(iosTimerRef.current);
    };
  }, [hide]);

  const onInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch {
      /* ignore */
    }
    setDeferredPrompt(null);
    hide();
  };

  if (!visible) return null;

  const isChrome = mode === 'chrome' && deferredPrompt;

  return (
    <div
      ref={rootRef}
      className="pwa-install-banner"
      role="region"
      aria-label="Instalar aplicação OnBible"
    >
      <div className="pwa-install-banner__icon" aria-hidden>
        <i className="fas fa-mobile-alt" />
      </div>
      <div className="pwa-install-banner__text">
        <strong className="pwa-install-banner__title">Instale o OnBible</strong>
        {isChrome ? (
          <p className="pwa-install-banner__desc">
            Acesso rápido ao ícone, melhor em ecrã inteiro e uso offline quando disponível.
          </p>
        ) : (
          <p className="pwa-install-banner__desc">
            Toque em <strong>Partilhar</strong>{' '}
            <i className="fas fa-share pwa-install-banner__inline-icon" aria-hidden /> e depois em{' '}
            <strong>Adicionar ao ecrã inicial</strong>.
          </p>
        )}
      </div>
      <div className="pwa-install-banner__actions">
        {isChrome && (
          <button type="button" className="pwa-install-banner__btn pwa-install-banner__btn--primary" onClick={onInstallClick}>
            Instalar
          </button>
        )}
        <button type="button" className="pwa-install-banner__btn pwa-install-banner__btn--ghost" onClick={dismiss}>
          Agora não
        </button>
      </div>
    </div>
  );
}
