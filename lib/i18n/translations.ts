import en from '../../messages/en.json';
import es from '../../messages/es.json';
import fr from '../../messages/fr.json';

export type Locale = 'en' | 'es' | 'fr';

export const translations = {
  en,
  es,
  fr,
} as const;

export type TranslationKey = keyof typeof en;



