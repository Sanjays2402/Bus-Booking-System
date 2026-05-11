import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { dictionaries, Locale, TranslationKey, LOCALES } from './dictionaries';

const STORAGE_KEY = 'app-locale';

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Translate a key with optional named placeholders: {name}, {count}, etc. */
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nCtx>(null!);

function readInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved && (saved === 'en' || saved === 'es')) return saved;
  // Fall back to browser language if it's one we support.
  const nav = (window.navigator.language || '').slice(0, 2).toLowerCase();
  if (nav === 'es') return 'es';
  return 'en';
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readInitialLocale());

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', locale);
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, locale);
    }
  }, [locale]);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const dict = dictionaries[locale] ?? dictionaries.en;
      const value = dict[key] ?? dictionaries.en[key] ?? key;
      return interpolate(value, vars);
    },
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale: setLocaleState, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nCtx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}

export { LOCALES };
export type { Locale, TranslationKey };
