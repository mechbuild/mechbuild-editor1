const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    try {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || 'dummy-key'
      });
    } catch (error) {
      console.warn('OpenAI initialization failed, falling back to local suggestions');
      this.openai = null;
    }
  }

  async generateProjectSuggestions(project) {
    if (!this.openai) {
      return this.generateLocalSuggestions(project);
    }

    try {
      const prompt = this.createPrompt(project);
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Sen bir inşaat ve mekanik tesisat uzmanısın. Projelere özel öneriler sunuyorsun."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return this.parseSuggestions(response.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return this.generateLocalSuggestions(project);
    }
  }

  async generateZoneSystems(project) {
    if (!this.openai) {
      return this.generateLocalZoneSystems(project);
    }

    try {
      const prompt = this.createZonePrompt(project);
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `Sen bir mekanik tesisat ve yapı sistemleri uzmanısın. 
                     Bina tipi, büyüklüğü, kat sayısı ve konuma göre gerekli sistemleri öneriyorsun.
                     Önerilerini detaylı gerekçeleriyle açıklıyorsun.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return this.parseZoneSystems(response.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return this.generateLocalZoneSystems(project);
    }
  }

  generateLocalSuggestions(project) {
    const suggestions = [];
    const { name, location, status } = project;

    if (name.toLowerCase().includes('otel') || name.toLowerCase().includes('hotel')) {
      suggestions.push({
        type: 'safety',
        title: 'Yangın Güvenliği',
        description: 'Otel projelerinde yangın alarm ve sprinkler sistemi zorunludur.',
        priority: 'high'
      });
    }

    if (location.toLowerCase().includes('istanbul')) {
      suggestions.push({
        type: 'safety',
        title: 'Deprem Güvenliği',
        description: 'İstanbul için güncel deprem yönetmeliğine uygunluk kontrolü gereklidir.',
        priority: 'high'
      });
    }

    return suggestions;
  }

  generateLocalZoneSystems(project) {
    const systems = [];
    const { buildingType, area, floorCount } = project;

    if (buildingType === 'Otel' || buildingType === 'Hastane') {
      systems.push({
        name: 'HVAC Sistemi',
        requirementLevel: 'Zorunlu',
        justification: 'Konfor ve sağlık için gerekli',
        technicalDetails: 'Merkezi klima sistemi, VRF veya chiller sistemi',
        costImpact: 'Yüksek'
      });
    }

    return systems;
  }

  createPrompt(project) {
    return `
      Aşağıdaki proje için öneriler oluştur:
      
      Proje Adı: ${project.name}
      Lokasyon: ${project.location}
      Durum: ${project.status}
      Bina Tipi: ${project.buildingType}
      Alan: ${project.area} m²
      Kat Sayısı: ${project.floorCount}
      
      Öneriler şu kategorilerde olmalı:
      1. Güvenlik (yangın, deprem vb.)
      2. Konfor (ses, ısı, nem vb.)
      3. Verimlilik (enerji, su, maliyet vb.)
      4. Yasal Gereklilikler
      5. Sürdürülebilirlik
      
      Her öneri için şunları belirt:
      - Başlık
      - Açıklama
      - Öncelik (high/medium)
      - Kategori (safety/comfort/efficiency/compliance/sustainability)
      
      Yanıtı JSON formatında ver.
    `;
  }

  createZonePrompt(project) {
    return `
      Aşağıdaki proje için gerekli sistemleri ve zonları analiz et:
      
      Bina Tipi: ${project.buildingType}
      Alan: ${project.area} m²
      Kat Sayısı: ${project.floorCount}
      Lokasyon: ${project.location}
      
      Şu başlıklar için öneriler sun:
      1. HVAC Sistemleri
      2. Yangın Güvenlik Sistemleri
      3. Sıhhi Tesisat Sistemleri
      4. Elektrik Sistemleri
      5. Otomasyon ve Kontrol
      6. Özel Sistemler (bina tipine özel)
      
      Her sistem için şunları belirt:
      - Sistem Adı
      - Gereklilik Seviyesi (Zorunlu/Önerilen/Opsiyonel)
      - Gerekçe (Neden bu sistem gerekli/öneriliyor?)
      - Teknik Detaylar
      - Tahmini Maliyet Etkisi (Düşük/Orta/Yüksek)
      
      Yanıtı JSON formatında ver.
    `;
  }

  parseSuggestions(content) {
    try {
      const suggestions = JSON.parse(content);
      return suggestions.map(suggestion => ({
        ...suggestion,
        type: suggestion.category,
        priority: suggestion.priority.toLowerCase()
      }));
    } catch (error) {
      console.error('Parsing Error:', error);
      return [];
    }
  }

  parseZoneSystems(content) {
    try {
      const systems = JSON.parse(content);
      return systems.map(system => ({
        ...system,
        requirementLevel: system.requirementLevel.toLowerCase(),
        costImpact: system.costImpact.toLowerCase()
      }));
    } catch (error) {
      console.error('Zone Systems Parsing Error:', error);
      return [];
    }
  }
}

module.exports = new OpenAIService(); 