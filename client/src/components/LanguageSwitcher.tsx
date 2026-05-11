import { Globe } from 'lucide-react';
import { useI18n, LOCALES, Locale } from '../i18n';

/**
 * Inline language switcher. Renders a small select styled to match the
 * glass theme. Persists choice via the I18nProvider.
 */
export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <label className="btn-glass rounded-full pl-3 pr-2 py-1.5 flex items-center gap-2 text-xs">
      <Globe size={14} />
      <span className="sr-only">{t('common.language')}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="bg-transparent border-none outline-none text-current cursor-pointer"
        aria-label={t('common.language')}
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
