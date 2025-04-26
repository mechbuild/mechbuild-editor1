# MechBuild Editor Dokümantasyonu

## İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [Kurulum](#kurulum)
3. [Kullanım Kılavuzu](#kullanım-kılavuzu)
4. [Teknik Dokümantasyon](#teknik-dokümantasyon)
5. [API Referansı](#api-referansı)
6. [Güvenlik](#güvenlik)
7. [Sorun Giderme](#sorun-giderme)

## Genel Bakış
MechBuild Editor, mekanik projelerin yönetimi ve analizi için geliştirilmiş bir web uygulamasıdır. DXF dosyalarının analizi, proje raporlarının oluşturulması ve AI destekli öneriler sunma gibi özellikleri içerir.

## Kurulum
1. Gereksinimler:
   - Node.js 16.x veya üzeri
   - npm 7.x veya üzeri
   - Modern bir web tarayıcısı

2. Kurulum Adımları:
   ```bash
   # Projeyi klonla
   git clone https://github.com/your-org/mechbuild-editor.git
   cd mechbuild-editor

   # Bağımlılıkları yükle
   npm install

   # Geliştirme sunucusunu başlat
   npm run dev
   ```

## Kullanım Kılavuzu

### Giriş Yapma
1. Tarayıcınızda uygulamayı açın
2. "Giriş Yap" butonuna tıklayın
3. Kullanıcı adı ve şifrenizi girin
   - Varsayılan kullanıcı: admin
   - Varsayılan şifre: 1234

### Proje Oluşturma
1. Ana sayfada "Yeni Proje" butonuna tıklayın
2. Proje adını girin
3. "Oluştur" butonuna tıklayın

### DXF Dosya Yükleme
1. Proje sayfasında "Dosya Yükle" butonuna tıklayın
2. DXF dosyanızı seçin
3. Yükleme tamamlandığında analiz sonuçları görüntülenecektir

### PDF Rapor Oluşturma
1. Proje sayfasında "Rapor Oluştur" butonuna tıklayın
2. Rapor ayarlarını yapılandırın
3. "Oluştur" butonuna tıklayın
4. PDF dosyası indirilecektir

## Teknik Dokümantasyon

### Sistem Mimarisi
- Frontend: React.js
- State Yönetimi: Context API
- Dosya İşleme: Node.js fs modülü
- PDF Oluşturma: PDFKit
- DXF İşleme: dxf-parser-lite

### Veritabanı Yapısı
- Projeler: `/mnt/data/projects`
- Loglar: `/mnt/data/logs`
- Geçici Dosyalar: `/mnt/data/temp`
- Yedekler: `/mnt/data/backups`

## API Referansı

### DXF Parser
```javascript
parseDXFFile(file: File): Promise<{
  status: boolean,
  layers: Object,
  notes: Array<string>,
  count: number
}>
```

### PDF Generator
```javascript
generateProjectPdf(
  projectName: string,
  summaryText: string,
  aiNotes: Array<string>
): Promise<string>
```

### Project Manager
```javascript
createProjectStructure(projectName: string): Promise<Object>
validateProjectStructure(projectPaths: Object): Promise<boolean>
```

## Güvenlik

### Dosya Güvenliği
- Maksimum dosya boyutu: 10MB
- İzin verilen dosya türleri: PDF, DOCX, XLSX, DXF
- Dosya içerik doğrulama

### Kullanıcı Güvenliği
- Brute force koruması
- Oturum yönetimi
- Rol tabanlı yetkilendirme

## Sorun Giderme

### Sık Karşılaşılan Sorunlar

1. DXF Dosya Yükleme Hatası
   - Çözüm: Dosyanın geçerli bir DXF formatında olduğundan emin olun
   - Kontrol: Dosya boyutu ve içerik doğrulaması

2. PDF Oluşturma Hatası
   - Çözüm: Dizin izinlerini kontrol edin
   - Kontrol: Disk alanı ve yazma izinleri

3. Giriş Sorunları
   - Çözüm: Kullanıcı adı ve şifreyi kontrol edin
   - Kontrol: Oturum durumu ve çerezler

### Hata Kodları
- 400: Geçersiz istek
- 401: Yetkisiz erişim
- 403: Erişim reddedildi
- 404: Kaynak bulunamadı
- 500: Sunucu hatası 