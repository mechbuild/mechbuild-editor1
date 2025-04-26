const errorMessages = {
  API: {
    BACKUP_FAILED: 'Yedekleme işlemi sırasında bir hata oluştu',
    RESTORE_FAILED: 'Geri yükleme işlemi sırasında bir hata oluştu',
    PROJECT_NOT_FOUND: 'Proje bulunamadı',
    INVALID_FILE: 'Geçersiz dosya formatı',
    UNAUTHORIZED: 'Oturum süresi dolmuş veya geçersiz',
    SERVER_ERROR: 'Sunucu hatası oluştu',
    NETWORK_ERROR: 'Ağ bağlantısı hatası'
  }
};

class ErrorService {
  static getErrorMessage(category, code) {
    return errorMessages[category]?.[code] || 'Beklenmeyen bir hata oluştu';
  }

  static async handle(error, context = '') {
    return this.handleApiError(error, context);
  }

  static async handleApiError(error, context) {
    console.error(`Error in ${context}:`, error);

    if (!navigator.onLine) {
      return { message: this.getErrorMessage('API', 'NETWORK_ERROR') };
    }

    if (error.response) {
      switch (error.response.status) {
        case 401:
          localStorage.removeItem('token');
          window.location.href = '/login';
          return { message: this.getErrorMessage('API', 'UNAUTHORIZED') };
        case 404:
          return { message: this.getErrorMessage('API', 'PROJECT_NOT_FOUND') };
        case 500:
          return { message: this.getErrorMessage('API', 'SERVER_ERROR') };
        default:
          return { message: error.response.data?.message || error.message };
      }
    }

    return { message: error.message || this.getErrorMessage('API', 'SERVER_ERROR') };
  }

  static showError(error, setError) {
    setError(error);
    setTimeout(() => setError(null), 5000);
  }

  static showSuccess(message, setSuccess) {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
  }
}

export default ErrorService; 