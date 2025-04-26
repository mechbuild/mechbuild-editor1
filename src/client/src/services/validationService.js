class ValidationService {
  static validateRequired(value, fieldName) {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} alanı zorunludur`;
    }
    return null;
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return 'E-posta alanı zorunludur';
    }
    if (!emailRegex.test(email)) {
      return 'Geçerli bir e-posta adresi giriniz';
    }
    return null;
  }

  static validatePassword(password) {
    if (!password) {
      return 'Şifre alanı zorunludur';
    }
    if (password.length < 6) {
      return 'Şifre en az 6 karakter olmalıdır';
    }
    return null;
  }

  static validateDate(date) {
    if (!date) {
      return 'Tarih alanı zorunludur';
    }
    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return 'Geçerli bir tarih giriniz';
    }
    return null;
  }

  static validateFileSize(file, maxSizeMB = 10) {
    if (!file) {
      return 'Dosya seçilmedi';
    }
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `Dosya boyutu ${maxSizeMB}MB'dan küçük olmalıdır`;
    }
    return null;
  }

  static validateFileType(file, allowedTypes) {
    if (!file) {
      return 'Dosya seçilmedi';
    }
    if (!allowedTypes.includes(file.type)) {
      return `Desteklenen dosya türleri: ${allowedTypes.join(', ')}`;
    }
    return null;
  }

  static validateForm(values, rules) {
    const errors = {};
    Object.keys(rules).forEach(field => {
      const value = values[field];
      const fieldRules = rules[field];

      fieldRules.forEach(rule => {
        const error = rule(value);
        if (error) {
          errors[field] = error;
          return;
        }
      });
    });
    return errors;
  }
}

export default ValidationService; 