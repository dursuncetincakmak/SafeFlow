import React, { createContext, useContext, useState } from 'react';
import type { Language } from './i18n';
import { i18n } from './i18n';

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof i18n['tr'];
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'tr',
  setLang: () => {},
  t: i18n['tr'],
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(
    (localStorage.getItem('vpass_lang') as Language) || 'tr'
  );

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('vpass_lang', newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: i18n[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

// Locale mapping for date/time formatting
export const getLocale = (lang: Language): string => {
  const localeMap: Record<Language, string> = {
    tr: 'tr-TR',
    en: 'en-US',
    es: 'es-ES'
  };
  return localeMap[lang] || 'en-US';
};
