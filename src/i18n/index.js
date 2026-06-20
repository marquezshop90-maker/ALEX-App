import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import es from './locales/es.json'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      EN: { translation: en },
      ES: { translation: es }
    },
    lng: localStorage.getItem('alex_lang') || 'EN',
    fallbackLng: 'EN',
    interpolation: { escapeValue: false }
  })

export default i18n
