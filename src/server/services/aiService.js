const openaiService = require('./openaiService');

class AIService {
  static async generateSuggestions(project) {
    try {
      // OpenAI'dan öneriler al
      const aiSuggestions = await openaiService.generateProjectSuggestions(project);
      
      // Eğer OpenAI önerileri başarılı ise onları kullan
      if (aiSuggestions && aiSuggestions.length > 0) {
        return aiSuggestions;
      }

      // Fallback: OpenAI başarısız olursa yerel öneriler
      return this.generateLocalSuggestions(project);
    } catch (error) {
      console.error('AI Service Error:', error);
      // Hata durumunda yerel önerilere dön
      return this.generateLocalSuggestions(project);
    }
  }

  static generateLocalSuggestions(project) {
    const suggestions = [];
    const { name, location, status } = project;

    // Proje adına göre öneriler
    if (name.toLowerCase().includes('otel') || name.toLowerCase().includes('hotel')) {
      suggestions.push({
        type: 'safety',
        title: 'Yangın Güvenliği',
        description: 'Otel projelerinde yangın alarm ve sprinkler sistemi zorunludur.',
        priority: 'high'
      });
      suggestions.push({
        type: 'comfort',
        title: 'Ses Yalıtımı',
        description: 'Misafir konforu için gelişmiş ses yalıtımı modülü önerilir.',
        priority: 'medium'
      });
    }

    // Lokasyona göre öneriler
    if (location.toLowerCase().includes('istanbul')) {
      suggestions.push({
        type: 'safety',
        title: 'Deprem Güvenliği',
        description: 'İstanbul için güncel deprem yönetmeliğine uygunluk kontrolü gereklidir.',
        priority: 'high'
      });
    } else if (location.toLowerCase().includes('antalya')) {
      suggestions.push({
        type: 'comfort',
        title: 'İklimlendirme',
        description: 'Sıcak iklim koşulları için özel iklimlendirme sistemi önerilir.',
        priority: 'high'
      });
    }

    // Duruma göre öneriler
    if (status === 'Planlandı') {
      suggestions.push({
        type: 'efficiency',
        title: 'Enerji Verimliliği',
        description: 'Planlama aşamasında enerji performans simülasyonu yapılması önerilir.',
        priority: 'medium'
      });
    } else if (status === 'Aktif') {
      suggestions.push({
        type: 'monitoring',
        title: 'İlerleme Takibi',
        description: 'Haftalık ilerleme raporu ve maliyet analizi önerilir.',
        priority: 'medium'
      });
    }

    // Genel öneriler
    suggestions.push({
      type: 'compliance',
      title: 'Yasal Uyumluluk',
      description: 'Güncel yapı yönetmeliklerine uygunluk kontrolü önerilir.',
      priority: 'high'
    });

    return suggestions;
  }
}

module.exports = AIService; 