import en from '../../messages/en.json';
import es from '../../messages/es.json';

export type Locale = 'en' | 'es';

export const translations = {
  en,
  es,
} as const;

export type TranslationKey = keyof typeof en;


