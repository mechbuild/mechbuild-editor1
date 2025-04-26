import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      'welcome': 'Welcome to MechBuild Editor2!',
      'dashboard': 'Dashboard',
      'projects': 'Projects',
      'settings': 'Settings',
      'profile': 'Profile',
      'login': 'Login',
      'register': 'Register',
      'logout': 'Logout',
      'notfound': 'Page not found',
      'loading': 'Loading...'
    }
  },
  tr: {
    translation: {
      'welcome': 'MechBuild Editor2\'ye Hoşgeldiniz!',
      'dashboard': 'Panel',
      'projects': 'Projeler',
      'settings': 'Ayarlar',
      'profile': 'Profil',
      'login': 'Giriş',
      'register': 'Kayıt Ol',
      'logout': 'Çıkış',
      'notfound': 'Sayfa bulunamadı',
      'loading': 'Yükleniyor...'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n; 