const ErrorService = {
  errorMessages: {
    API: {
      LOAD_FAILED: 'Veri yüklenirken bir hata oluştu',
      SAVE_FAILED: 'Veri kaydedilirken bir hata oluştu',
      DELETE_FAILED: 'Veri silinirken bir hata oluştu',
      EXPORT_FAILED: 'Dışa aktarma işlemi başarısız oldu'
    },
    FILE: {
      INVALID_TYPE: 'Geçersiz dosya türü',
      TOO_LARGE: 'Dosya boyutu çok büyük',
      CORRUPTED: 'Dosya bozuk veya okunamıyor',
      UPLOAD_FAILED: 'Dosya yüklenirken bir hata oluştu'
    },
    VALIDATION: {
      REQUIRED: 'Bu alan zorunludur',
      INVALID_FORMAT: 'Geçersiz format',
      INVALID_VALUE: 'Geçersiz değer'
    },
    SYSTEM: {
      UNEXPECTED: 'Beklenmeyen bir hata oluştu',
      NETWORK: 'Ağ bağlantısı hatası',
      PERMISSION: 'Bu işlem için yetkiniz yok'
    }
  },

  async handle(error, context = '', options = {}) {
    const { showToast = true, logToConsole = true } = options;
    
    // Hatayı işle
    const processedError = await this.handleError(error);
    
    // Konsola logla
    if (logToConsole) {
      console.error(`[${context}]`, error);
    }
    
    // Toast göster
    if (showToast) {
      console.error(processedError.message);
    }
    
    return processedError;
  },

  async handleApiError(error, context = '') {
    return this.handle(error, `API Error - ${context}`, {
      showToast: true,
      logToConsole: true
    });
  },

  async handleFileError(error, context = '') {
    return this.handle(error, `File Error - ${context}`, {
      showToast: true,
      logToConsole: true
    });
  },

  async handleValidationError(error, context = '') {
    return this.handle(error, `Validation Error - ${context}`, {
      showToast: true,
      logToConsole: true
    });
  },

  async handleSystemError(error, context = '') {
    return this.handle(error, `System Error - ${context}`, {
      showToast: true,
      logToConsole: true
    });
  },

  getErrorMessage(type, code) {
    return this.errorMessages[type]?.[code] || this.errorMessages.SYSTEM.UNEXPECTED;
  },

  handleError(error) {
    console.error('Error:', error);
    return {
      success: false,
      error: error.message || 'Bir hata oluştu'
    };
  },

  showError(message) {
    console.error('Error Message:', message);
    alert(message);
  }
};

export default ErrorService; 