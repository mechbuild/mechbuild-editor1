import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      welcome: 'Welcome to MechBuild',
      login: {
        title: 'Login',
        username: 'Username',
        password: 'Password',
        submit: 'Login',
        error: 'Login failed'
      },
      navbar: {
        home: 'Home',
        projects: 'Projects',
        dashboard: '📊 Dashboard',
        map: '🗺️ Map',
        monitoring: '📈 Monitoring',
        aiConsole: '📡 AI Console',
        settings: '⚙️ Settings',
        logout: 'Logout',
        aiReport: 'AI Report'
      },
      settings: {
        title: 'Settings',
        email: 'Email',
        notifications: 'Enable Notifications',
        darkMode: 'Dark Mode',
        save: 'Save',
        saved: 'Settings saved successfully'
      },
      aiConsole: {
        title: 'AI Console',
        promptPlaceholder: 'Ask the AI...',
        send: 'Send',
        you: 'You:',
        ai: 'AI:'
      },
      'admin.title': 'Admin Panel',
      'admin.tabs.users': 'Users',
      'admin.tabs.logs': 'API Logs',
      'admin.tabs.audit': 'Settings Audit',
      'admin.users.email': 'Email',
      'admin.users.role': 'Role',
      'admin.users.createdAt': 'Created At',
      'admin.users.actions': 'Actions',
      'admin.users.deleteConfirm': 'Delete User',
      'admin.users.deleteWarning': 'Are you sure you want to delete this user? This action cannot be undone.',
      'admin.users.promoteConfirm': 'Promote User',
      'admin.users.promoteWarning': 'Are you sure you want to promote this user to admin?',
      'admin.logs.endpoint': 'Endpoint',
      'admin.logs.method': 'Method',
      'admin.logs.status': 'Status',
      'admin.logs.user': 'User',
      'admin.logs.timestamp': 'Timestamp',
      'admin.audit.setting': 'Setting',
      'admin.audit.oldValue': 'Old Value',
      'admin.audit.newValue': 'New Value',
      'admin.audit.user': 'User',
      'admin.audit.timestamp': 'Timestamp',
      'navbar.admin': 'Admin Panel',
      'common.delete': 'Delete',
      'common.promote': 'Promote',
      'common.cancel': 'Cancel',
      'aiReport.title': 'AI Report Generator',
      'aiReport.selectProject': 'Select Project',
      'aiReport.generate': 'Generate AI Report',
      'aiReport.generatedReport': 'Generated Report',
      'aiReport.feedback': 'Report Feedback',
      'aiReport.rating': 'Rate this report:',
      'aiReport.comment': 'Your comments (optional)',
      'aiReport.submitFeedback': 'Submit Feedback',
      'changelog.title': 'Changelog',
      'changelog.createNew': 'Create New Changelog Entry',
      'changelog.version': 'Version',
      'changelog.versionHelper': 'Use semantic versioning (e.g., 1.0.0)',
      'changelog.title': 'Title',
      'changelog.content': 'Content',
      'changelog.type': 'Type',
      'changelog.impact': 'Impact',
      'changelog.create': 'Create Entry',
      'changelog.history': 'Changelog History',
      'changelog.types': {
        'feature': 'New Feature',
        'bugfix': 'Bug Fix',
        'improvement': 'Improvement',
        'security': 'Security Update'
      },
      'changelog.impacts': {
        'major': 'Major',
        'minor': 'Minor',
        'patch': 'Patch'
      },
      'settings.tabs': {
        'general': 'General',
        'account': 'Account',
        'about': 'About',
        'changelog': 'Changelog Admin'
      },
      'settings.about': {
        'title': 'About MechBuildPro',
        'description': 'MechBuildPro is a comprehensive project management and monitoring system designed for mechanical engineering projects.',
        'changelog': 'Version History'
      },
      'systemStatus': {
        'title': 'System Status',
        'refresh': 'Refresh Status',
        'lastChecked': 'Last Checked',
        'checking': 'Checking...',
        'ok': 'Operational',
        'warning': 'Degraded',
        'error': 'Failed',
        'services': {
          'auth': 'Authentication Service',
          'db': 'Database Service',
          'ai': 'AI Service',
          'monitoring': 'Monitoring Service'
        }
      }
    }
  },
  tr: {
    translation: {
      welcome: 'MechBuild\'e Hoş Geldiniz',
      login: {
        title: 'Giriş Yap',
        username: 'Kullanıcı Adı',
        password: 'Şifre',
        submit: 'Giriş Yap',
        error: 'Giriş başarısız'
      },
      navbar: {
        home: 'Ana Sayfa',
        projects: 'Projeler',
        dashboard: '📊 Panel',
        map: '🗺️ Harita',
        monitoring: '📈 İzleme',
        aiConsole: '📡 AI Konsol',
        settings: '⚙️ Ayarlar',
        logout: 'Çıkış Yap',
        aiReport: 'AI Rapor'
      },
      settings: {
        title: 'Ayarlar',
        email: 'E-posta',
        notifications: 'Bildirimleri Etkinleştir',
        darkMode: 'Karanlık Mod',
        save: 'Kaydet',
        saved: 'Ayarlar başarıyla kaydedildi'
      },
      aiConsole: {
        title: 'AI Konsol',
        promptPlaceholder: 'AI\'ya soru sorun...',
        send: 'Gönder',
        you: 'Siz:',
        ai: 'AI:'
      },
      'admin.title': 'Yönetici Paneli',
      'admin.tabs.users': 'Kullanıcılar',
      'admin.tabs.logs': 'API Kayıtları',
      'admin.tabs.audit': 'Ayarlar Denetimi',
      'admin.users.email': 'E-posta',
      'admin.users.role': 'Rol',
      'admin.users.createdAt': 'Oluşturulma Tarihi',
      'admin.users.actions': 'İşlemler',
      'admin.users.deleteConfirm': 'Kullanıcıyı Sil',
      'admin.users.deleteWarning': 'Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      'admin.users.promoteConfirm': 'Kullanıcıyı Yükselt',
      'admin.users.promoteWarning': 'Bu kullanıcıyı yönetici olarak yükseltmek istediğinizden emin misiniz?',
      'admin.logs.endpoint': 'Endpoint',
      'admin.logs.method': 'Metod',
      'admin.logs.status': 'Durum',
      'admin.logs.user': 'Kullanıcı',
      'admin.logs.timestamp': 'Zaman',
      'admin.audit.setting': 'Ayar',
      'admin.audit.oldValue': 'Eski Değer',
      'admin.audit.newValue': 'Yeni Değer',
      'admin.audit.user': 'Kullanıcı',
      'admin.audit.timestamp': 'Zaman',
      'navbar.admin': 'Yönetici Paneli',
      'common.delete': 'Sil',
      'common.promote': 'Yükselt',
      'common.cancel': 'İptal',
      'aiReport.title': 'AI Rapor Oluşturucu',
      'aiReport.selectProject': 'Proje Seçin',
      'aiReport.generate': 'AI Raporu Oluştur',
      'aiReport.generatedReport': 'Oluşturulan Rapor',
      'aiReport.feedback': 'Rapor Geri Bildirimi',
      'aiReport.rating': 'Bu raporu değerlendirin:',
      'aiReport.comment': 'Yorumlarınız (isteğe bağlı)',
      'aiReport.submitFeedback': 'Geri Bildirim Gönder',
      'changelog.title': 'Değişiklik Günlüğü',
      'changelog.createNew': 'Yeni Değişiklik Günlüğü Girdisi Oluştur',
      'changelog.version': 'Versiyon',
      'changelog.versionHelper': 'Semantik versiyonlama kullanın (örn., 1.0.0)',
      'changelog.title': 'Başlık',
      'changelog.content': 'İçerik',
      'changelog.type': 'Tür',
      'changelog.impact': 'Etki',
      'changelog.create': 'Girdi Oluştur',
      'changelog.history': 'Değişiklik Günlüğü Geçmişi',
      'changelog.types': {
        'feature': 'Yeni Özellik',
        'bugfix': 'Hata Düzeltmesi',
        'improvement': 'İyileştirme',
        'security': 'Güvenlik Güncellemesi'
      },
      'changelog.impacts': {
        'major': 'Önemli',
        'minor': 'Küçük',
        'patch': 'Yama'
      },
      'settings.tabs': {
        'general': 'Genel',
        'account': 'Hesap',
        'about': 'Hakkında',
        'changelog': 'Değişiklik Günlüğü Yönetimi'
      },
      'settings.about': {
        'title': 'MechBuildPro Hakkında',
        'description': 'MechBuildPro, mekanik mühendislik projeleri için tasarlanmış kapsamlı bir proje yönetimi ve izleme sistemidir.',
        'changelog': 'Versiyon Geçmişi'
      },
      'systemStatus': {
        'title': 'Sistem Durumu',
        'refresh': 'Durumu Yenile',
        'lastChecked': 'Son Kontrol',
        'checking': 'Kontrol Ediliyor...',
        'ok': 'Çalışıyor',
        'warning': 'Bozuk',
        'error': 'Hata',
        'services': {
          'auth': 'Kimlik Doğrulama Servisi',
          'db': 'Veritabanı Servisi',
          'ai': 'Yapay Zeka Servisi',
          'monitoring': 'İzleme Servisi'
        }
      }
    }
  },
  ru: {
    translation: {
      welcome: 'Добро пожаловать в MechBuild',
      login: {
        title: 'Вход',
        username: 'Имя пользователя',
        password: 'Пароль',
        submit: 'Войти',
        error: 'Ошибка входа'
      },
      navbar: {
        home: 'Главная',
        projects: 'Проекты',
        dashboard: '📊 Панель',
        map: '🗺️ Карта',
        monitoring: '📈 Мониторинг',
        aiConsole: '📡 AI Консоль',
        settings: '⚙️ Настройки',
        logout: 'Выйти',
        aiReport: 'Отчет ИИ'
      },
      settings: {
        title: 'Настройки',
        email: 'Эл. почта',
        notifications: 'Включить уведомления',
        darkMode: 'Темный режим',
        save: 'Сохранить',
        saved: 'Настройки сохранены'
      },
      aiConsole: {
        title: 'AI Консоль',
        promptPlaceholder: 'Задайте вопрос AI...',
        send: 'Отправить',
        you: 'Вы:',
        ai: 'AI:'
      },
      'admin.title': 'Панель администратора',
      'admin.tabs.users': 'Пользователи',
      'admin.tabs.logs': 'API Логи',
      'admin.tabs.audit': 'Аудит настроек',
      'admin.users.email': 'Email',
      'admin.users.role': 'Роль',
      'admin.users.createdAt': 'Дата создания',
      'admin.users.actions': 'Действия',
      'admin.users.deleteConfirm': 'Удалить пользователя',
      'admin.users.deleteWarning': 'Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить.',
      'admin.users.promoteConfirm': 'Повысить пользователя',
      'admin.users.promoteWarning': 'Вы уверены, что хотите повысить этого пользователя до администратора?',
      'admin.logs.endpoint': 'Endpoint',
      'admin.logs.method': 'Метод',
      'admin.logs.status': 'Статус',
      'admin.logs.user': 'Пользователь',
      'admin.logs.timestamp': 'Время',
      'admin.audit.setting': 'Настройка',
      'admin.audit.oldValue': 'Старое значение',
      'admin.audit.newValue': 'Новое значение',
      'admin.audit.user': 'Пользователь',
      'admin.audit.timestamp': 'Время',
      'navbar.admin': 'Панель администратора',
      'common.delete': 'Удалить',
      'common.promote': 'Повысить',
      'common.cancel': 'Отмена',
      'aiReport.title': 'Генератор отчетов ИИ',
      'aiReport.selectProject': 'Выберите проект',
      'aiReport.generate': 'Сгенерировать отчет ИИ',
      'aiReport.generatedReport': 'Сгенерированный отчет',
      'aiReport.feedback': 'Отзыв об отчете',
      'aiReport.rating': 'Оцените этот отчет:',
      'aiReport.comment': 'Ваши комментарии (необязательно)',
      'aiReport.submitFeedback': 'Отправить отзыв',
      'changelog.title': 'История изменений',
      'changelog.createNew': 'Создать новую запись в истории изменений',
      'changelog.version': 'Версия',
      'changelog.versionHelper': 'Используйте семантическое версионирование (например, 1.0.0)',
      'changelog.title': 'Заголовок',
      'changelog.content': 'Содержание',
      'changelog.type': 'Тип',
      'changelog.impact': 'Влияние',
      'changelog.create': 'Создать запись',
      'changelog.history': 'История изменений',
      'changelog.types': {
        'feature': 'Новая функция',
        'bugfix': 'Исправление ошибки',
        'improvement': 'Улучшение',
        'security': 'Обновление безопасности'
      },
      'changelog.impacts': {
        'major': 'Важное',
        'minor': 'Незначительное',
        'patch': 'Патч'
      },
      'settings.tabs': {
        'general': 'Общие',
        'account': 'Аккаунт',
        'about': 'О программе',
        'changelog': 'Управление историей изменений'
      },
      'settings.about': {
        'title': 'О MechBuildPro',
        'description': 'MechBuildPro - это комплексная система управления проектами и мониторинга, разработанная для механических инженерных проектов.',
        'changelog': 'История версий'
      },
      'systemStatus': {
        'title': 'Состояние системы',
        'refresh': 'Обновить статус',
        'lastChecked': 'Последняя проверка',
        'checking': 'Проверка...',
        'ok': 'Работает',
        'warning': 'Снижена',
        'error': 'Ошибка',
        'services': {
          'auth': 'Служба аутентификации',
          'db': 'Служба базы данных',
          'ai': 'Служба ИИ',
          'monitoring': 'Служба мониторинга'
        }
      }
    }
  },
  ar: {
    translation: {
      welcome: 'مرحباً بك في MechBuild',
      login: {
        title: 'تسجيل الدخول',
        username: 'اسم المستخدم',
        password: 'كلمة المرور',
        submit: 'دخول',
        error: 'فشل تسجيل الدخول'
      },
      navbar: {
        home: 'الرئيسية',
        projects: 'المشاريع',
        dashboard: '📊 لوحة التحكم',
        map: '🗺️ الخريطة',
        monitoring: '📈 المراقبة',
        aiConsole: '📡 وحدة التحكم AI',
        settings: '⚙️ الإعدادات',
        logout: 'تسجيل الخروج',
        aiReport: 'تقرير الذكاء الاصطناعي'
      },
      settings: {
        title: 'الإعدادات',
        email: 'البريد الإلكتروني',
        notifications: 'تفعيل الإشعارات',
        darkMode: 'الوضع الداكن',
        save: 'حفظ',
        saved: 'تم حفظ الإعدادات بنجاح'
      },
      aiConsole: {
        title: 'وحدة التحكم AI',
        promptPlaceholder: 'اسأل الذكاء الاصطناعي...',
        send: 'إرسال',
        you: 'أنت:',
        ai: 'AI:'
      },
      'admin.title': 'لوحة الإدارة',
      'admin.tabs.users': 'المستخدمون',
      'admin.tabs.logs': 'سجلات API',
      'admin.tabs.audit': 'مراجعة الإعدادات',
      'admin.users.email': 'البريد الإلكتروني',
      'admin.users.role': 'الدور',
      'admin.users.createdAt': 'تاريخ الإنشاء',
      'admin.users.actions': 'الإجراءات',
      'admin.users.deleteConfirm': 'حذف المستخدم',
      'admin.users.deleteWarning': 'هل أنت متأكد من رغبتك في حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.',
      'admin.users.promoteConfirm': 'ترقية المستخدم',
      'admin.users.promoteWarning': 'هل أنت متأكد من رغبتك في ترقية هذا المستخدم إلى مشرف؟',
      'admin.logs.endpoint': 'نقطة النهاية',
      'admin.logs.method': 'الطريقة',
      'admin.logs.status': 'الحالة',
      'admin.logs.user': 'المستخدم',
      'admin.logs.timestamp': 'الوقت',
      'admin.audit.setting': 'الإعداد',
      'admin.audit.oldValue': 'القيمة القديمة',
      'admin.audit.newValue': 'القيمة الجديدة',
      'admin.audit.user': 'المستخدم',
      'admin.audit.timestamp': 'الوقت',
      'navbar.admin': 'لوحة الإدارة',
      'common.delete': 'حذف',
      'common.promote': 'ترقية',
      'common.cancel': 'إلغاء',
      'aiReport.title': 'منشئ تقارير الذكاء الاصطناعي',
      'aiReport.selectProject': 'اختر المشروع',
      'aiReport.generate': 'إنشاء تقرير الذكاء الاصطناعي',
      'aiReport.generatedReport': 'التقرير المولد',
      'aiReport.feedback': 'ملاحظات التقرير',
      'aiReport.rating': 'قيم هذا التقرير:',
      'aiReport.comment': 'تعليقاتك (اختياري)',
      'aiReport.submitFeedback': 'إرسال الملاحظات',
      'changelog.title': 'سجل التغييرات',
      'changelog.createNew': 'إنشاء إدخال جديد في سجل التغييرات',
      'changelog.version': 'الإصدار',
      'changelog.versionHelper': 'استخدم الترقيم الدلالي (مثال: 1.0.0)',
      'changelog.title': 'العنوان',
      'changelog.content': 'المحتوى',
      'changelog.type': 'النوع',
      'changelog.impact': 'التأثير',
      'changelog.create': 'إنشاء إدخال',
      'changelog.history': 'سجل التغييرات',
      'changelog.types': {
        'feature': 'ميزة جديدة',
        'bugfix': 'إصلاح خطأ',
        'improvement': 'تحسين',
        'security': 'تحديث أمني'
      },
      'changelog.impacts': {
        'major': 'رئيسي',
        'minor': 'ثانوي',
        'patch': 'تصحيح'
      },
      'settings.tabs': {
        'general': 'عام',
        'account': 'الحساب',
        'about': 'حول',
        'changelog': 'إدارة سجل التغييرات'
      },
      'settings.about': {
        'title': 'حول MechBuildPro',
        'description': 'MechBuildPro هو نظام شامل لإدارة المشاريع والمراقبة مصمم لمشاريع الهندسة الميكانيكية.',
        'changelog': 'سجل الإصدارات'
      },
      'systemStatus': {
        'title': 'حالة النظام',
        'refresh': 'تحديث الحالة',
        'lastChecked': 'آخر فحص',
        'checking': 'جاري الفحص...',
        'ok': 'يعمل',
        'warning': 'متدني',
        'error': 'فشل',
        'services': {
          'auth': 'خدمة المصادقة',
          'db': 'خدمة قاعدة البيانات',
          'ai': 'خدمة الذكاء الاصطناعي',
          'monitoring': 'خدمة المراقبة'
        }
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n; 