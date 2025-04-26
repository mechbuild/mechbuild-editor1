import i18n from 'i18next';
import { initReactI18next } from 'i18next-react';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

const isDevelopment = process.env.NODE_ENV === 'development';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          // Common
          'common.loading': 'Loading...',
          'common.error': 'An error occurred',
          'common.success': 'Success',
          'common.save': 'Save',
          'common.cancel': 'Cancel',
          'common.delete': 'Delete',
          'common.edit': 'Edit',
          'common.view': 'View',
          'common.search': 'Search',
          'common.filter': 'Filter',
          'common.sort': 'Sort',
          'common.actions': 'Actions',

          // Auth
          'auth.login': 'Login',
          'auth.logout': 'Logout',
          'auth.register': 'Register',
          'auth.email': 'Email',
          'auth.password': 'Password',
          'auth.confirmPassword': 'Confirm Password',
          'auth.forgotPassword': 'Forgot Password?',
          'auth.resetPassword': 'Reset Password',

          // Navigation
          'nav.home': 'Home',
          'nav.dashboard': 'Dashboard',
          'nav.projects': 'Projects',
          'nav.settings': 'Settings',
          'nav.profile': 'Profile',

          // Projects
          'projects.title': 'Projects',
          'projects.create': 'Create Project',
          'projects.edit': 'Edit Project',
          'projects.delete': 'Delete Project',
          'projects.name': 'Project Name',
          'projects.description': 'Description',
          'projects.status': 'Status',
          'projects.startDate': 'Start Date',
          'projects.endDate': 'End Date',
          'projects.team': 'Team',
          'projects.tasks': 'Tasks',

          // Settings
          'settings.title': 'Settings',
          'settings.language': 'Language',
          'settings.theme': 'Theme',
          'settings.notifications': 'Notifications',
          'settings.security': 'Security',

          // Home
          'home.title': 'Welcome to MechBuild!',
          'home.description': 'Manage your projects, teams, and more with ease.',
          'home.getStarted': 'Get Started',
          'home.features.projectManagement': 'Project Management',
          'home.features.projectManagementDesc': 'Easily manage all your engineering projects in one place.',
          'home.features.dashboard': 'Dashboard',
          'home.features.dashboardDesc': 'View analytics and project status at a glance.',
          'home.features.settings': 'Settings',
          'home.features.settingsDesc': 'Customize your experience and preferences.'
        }
      },
      tr: {
        translation: {
          // Common
          'common.loading': 'Yükleniyor...',
          'common.error': 'Bir hata oluştu',
          'common.success': 'Başarılı',
          'common.save': 'Kaydet',
          'common.cancel': 'İptal',
          'common.delete': 'Sil',
          'common.edit': 'Düzenle',
          'common.view': 'Görüntüle',
          'common.search': 'Ara',
          'common.filter': 'Filtrele',
          'common.sort': 'Sırala',
          'common.actions': 'İşlemler',

          // Auth
          'auth.login': 'Giriş Yap',
          'auth.logout': 'Çıkış Yap',
          'auth.register': 'Kayıt Ol',
          'auth.email': 'E-posta',
          'auth.password': 'Şifre',
          'auth.confirmPassword': 'Şifre Tekrar',
          'auth.forgotPassword': 'Şifremi Unuttum',
          'auth.resetPassword': 'Şifre Sıfırla',

          // Navigation
          'nav.home': 'Ana Sayfa',
          'nav.dashboard': 'Panel',
          'nav.projects': 'Projeler',
          'nav.settings': 'Ayarlar',
          'nav.profile': 'Profil',

          // Projects
          'projects.title': 'Projeler',
          'projects.create': 'Proje Oluştur',
          'projects.edit': 'Proje Düzenle',
          'projects.delete': 'Proje Sil',
          'projects.name': 'Proje Adı',
          'projects.description': 'Açıklama',
          'projects.status': 'Durum',
          'projects.startDate': 'Başlangıç Tarihi',
          'projects.endDate': 'Bitiş Tarihi',
          'projects.team': 'Ekip',
          'projects.tasks': 'Görevler',

          // Settings
          'settings.title': 'Ayarlar',
          'settings.language': 'Dil',
          'settings.theme': 'Tema',
          'settings.notifications': 'Bildirimler',
          'settings.security': 'Güvenlik',

          // Home
          'home.title': 'MechBuild'e Hoşgeldiniz!',
          'home.description': 'Projelerinizi, ekiplerinizi ve daha fazlasını kolayca yönetin.',
          'home.getStarted': 'Başla',
          'home.features.projectManagement': 'Proje Yönetimi',
          'home.features.projectManagementDesc': 'Tüm mühendislik projelerinizi tek bir yerde kolayca yönetin.',
          'home.features.dashboard': 'Panel',
          'home.features.dashboardDesc': 'Analitikleri ve proje durumunu tek bakışta görün.',
          'home.features.settings': 'Ayarlar',
          'home.features.settingsDesc': 'Deneyiminizi ve tercihlerinizi özelleştirin.'
        }
      }
    },
    fallbackLng: 'en',
    debug: isDevelopment,
    interpolation: {
      escapeValue: false
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
