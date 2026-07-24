import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { translations, type Language, type TranslationKey } from '@/i18n/translations';

interface LanguageContextType {
  language: Language;
  isRTL: boolean;
  dir: 'rtl' | 'ltr';
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (ar: string, en: string) => string;
  tr: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'ar',
  isRTL: true,
  dir: 'rtl',
  toggleLanguage: () => {},
  setLanguage: () => {},
  t: (ar: string) => ar,
  tr: (key: TranslationKey) => translations.ar[key],
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'ar';
    const saved = window.localStorage.getItem('madar-language');
    return saved === 'en' || saved === 'ar' ? saved : 'ar';
  });
  const isRTL = language === 'ar';

  const toggleLanguage = useCallback(() => {
    setLanguageState(prev => prev === 'ar' ? 'en' : 'ar');
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback((ar: string, en: string) => {
    return language === 'ar' ? ar : en;
  }, [language]);

  const tr = useCallback((key: TranslationKey) => {
    return translations[language][key];
  }, [language]);

  useEffect(() => {
    window.localStorage.setItem('madar-language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [language, isRTL]);

  return (
    <LanguageContext.Provider value={{ language, isRTL, dir: isRTL ? 'rtl' : 'ltr', toggleLanguage, setLanguage, t, tr }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
