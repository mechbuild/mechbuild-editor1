# Excel Analiz Sistemi

Bu proje, Excel dosyalarını analiz eden ve raporlayan bir web uygulamasıdır. Güvenlik, performans ve kullanıcı deneyimi odaklı olarak geliştirilmiştir.

## Özellikler

- Excel dosyalarını yükleme ve analiz etme
- Detaylı analiz raporları oluşturma
- Güvenli dosya işleme
- Yüksek performanslı analiz motoru
- Gerçek zamanlı ilerleme takibi
- Çoklu format desteği (PDF, HTML, Excel)
- Kullanıcı dostu arayüz

## Teknik Detaylar

### Güvenlik Özellikleri

- JWT tabanlı kimlik doğrulama
- API anahtarı doğrulama
- Rate limiting
- Dosya tipi ve boyut kontrolü
- CORS yapılandırması
- Güvenlik başlıkları (Helmet)
- Şüpheli aktivite izleme
- XSS ve CSRF koruması

### Performans Optimizasyonları

- Response time ölçümü
- Sıkıştırma
- Önbellek yönetimi
- Sorgu optimizasyonu
- Kaynak optimizasyonu
- Bellek kullanımı izleme
- Statik dosya önbellekleme

### Monitoring ve Logging

- Request/response loglama
- Hata izleme
- Performans metrikleri
- Güvenlik olayları loglama
- Bellek kullanımı izleme
- API kullanım istatistikleri

## Kurulum

### Gereksinimler

- Node.js 14.x veya üzeri
- npm 6.x veya üzeri
- MongoDB 4.x veya üzeri

### Adımlar

1. Repoyu klonlayın:
```bash
git clone https://github.com/yourusername/excel-analysis-system.git
cd excel-analysis-system
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Ortam değişkenlerini ayarlayın:
```bash
cp .env.example .env
# .env dosyasını düzenleyin
```

4. Uygulamayı başlatın:
```bash
npm start
```

## API Dokümantasyonu

### Endpoints

#### POST /api/upload
Excel dosyası yükleme ve analiz başlatma

**Request:**
```json
{
  "file": "Excel dosyası"
}
```

**Response:**
```json
{
  "operationId": "string",
  "status": "string"
}
```

#### GET /api/operation/:operationId
Analiz durumunu kontrol etme

**Response:**
```json
{
  "status": "string",
  "progress": number,
  "analysis": {
    "totalSheets": number,
    "totalCells": number,
    "totalFormulas": number,
    "sheets": []
  }
}
```

#### POST /api/export-analysis/:operationId
Analiz raporu oluşturma

**Request:**
```json
{
  "format": "pdf|html|excel",
  "title": "string",
  "includeCharts": boolean,
  "includeFormulas": boolean,
  "includeStyles": boolean,
  "includeDetails": boolean,
  "includeRecommendations": boolean
}
```

**Response:**
```json
{
  "url": "string",
  "filename": "string"
}
```

## Güvenlik

### API Anahtarı
Tüm API istekleri için geçerli bir API anahtarı gereklidir:
```
X-API-Key: your-api-key
```

### JWT Token
Kimlik doğrulama gerektiren endpoint'ler için JWT token gereklidir:
```
Authorization: Bearer your-jwt-token
```

## Test

```bash
# Tüm testleri çalıştır
npm test

# Belirli bir test dosyasını çalıştır
npm test -- security.test.js

# Coverage raporu oluştur
npm run test:coverage
```

## CI/CD

Proje GitHub Actions ile CI/CD pipeline'ına sahiptir:

- Her push'ta testler çalıştırılır
- Her tag'de production build oluşturulur
- Her PR'da linting ve testler çalıştırılır

## Monitoring

Uygulama aşağıdaki metrikleri toplar:

- HTTP response time
- Bellek kullanımı
- Cache hit/miss oranları
- API kullanım istatistikleri
- Hata oranları

## Katkıda Bulunma

1. Fork'layın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## İletişim

Sorularınız için: support@example.com