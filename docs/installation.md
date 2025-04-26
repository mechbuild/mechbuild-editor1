# MechBuild Pro Kurulum Kılavuzu

## Sistem Gereksinimleri

- Node.js v14.0.0 veya üzeri
- MongoDB v4.4.0 veya üzeri
- npm v6.14.0 veya üzeri
- Minimum 4GB RAM
- 10GB boş disk alanı

## Adım Adım Kurulum

### 1. Sistem Bağımlılıklarının Kurulumu

```bash
# Node.js ve npm kurulumu (Windows)
# https://nodejs.org adresinden indirin ve kurulumu yapın

# MongoDB kurulumu (Windows)
# https://www.mongodb.com/try/download/community adresinden indirin ve kurulumu yapın
```

### 2. Proje Dosyalarının Hazırlanması

```bash
# Proje klasörüne gidin
cd mechbuildpro-final-v1

# Bağımlılıkları yükleyin
npm install

# Frontend bağımlılıklarını yükleyin
cd frontend
npm install
cd ..
```

### 3. Çevresel Değişkenlerin Ayarlanması

`.env` dosyasını oluşturun ve aşağıdaki değişkenleri ekleyin:

```env
# Sunucu Ayarları
PORT=3000
NODE_ENV=production

# MongoDB Bağlantısı
MONGODB_URI=mongodb://localhost:27017/mechbuild

# JWT Ayarları
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# OpenAI API Ayarları
OPENAI_API_KEY=your-api-key

# Dosya Yükleme Ayarları
MAX_FILE_SIZE=50mb
UPLOAD_DIR=./uploads
```

### 4. Veritabanı Kurulumu

```bash
# MongoDB servisini başlatın
# Windows için:
net start MongoDB

# Veritabanını oluşturun
mongosh
use mechbuild
```

### 5. Başlangıç Verilerinin Yüklenmesi

```bash
# Seed verileri yükleyin
npm run seed
```

### 6. Uygulamayı Başlatma

```bash
# Geliştirme modu
npm run dev

# Üretim modu
npm run build
npm start
```

## SSL Sertifikası Kurulumu (Opsiyonel)

```bash
# SSL sertifikası oluşturma
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout private.key -out certificate.crt
```

## Güvenlik Ayarları

1. Güvenlik duvarı kurallarını ayarlayın
2. Rate limiting'i aktifleştirin
3. CORS ayarlarını yapılandırın

## Sorun Giderme

### Yaygın Hatalar ve Çözümleri

1. MongoDB Bağlantı Hatası
   ```
   Error: MongoNetworkError: connect ECONNREFUSED
   ```
   Çözüm: MongoDB servisinin çalıştığından emin olun

2. Port Çakışması
   ```
   Error: listen EADDRINUSE :::3000
   ```
   Çözüm: Farklı bir port numarası kullanın

3. Node Modülleri Hatası
   ```
   Error: Cannot find module
   ```
   Çözüm: `npm install` komutunu tekrar çalıştırın

## Sistem Kontrolü

Kurulum sonrası aşağıdaki kontrolleri yapın:

1. http://localhost:3000 adresine erişim
2. Admin paneline giriş
3. Dosya yükleme testi
4. AI konsol testi
5. Harita modülü testi

## Yedekleme ve Geri Yükleme

```bash
# Veritabanı yedekleme
mongodump --db mechbuild --out ./backups

# Veritabanı geri yükleme
mongorestore --db mechbuild ./backups/mechbuild
``` 