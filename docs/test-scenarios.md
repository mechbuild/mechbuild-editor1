# MechBuild Pro Test Senaryoları

## 🔐 Kimlik Doğrulama Testleri

### TC-001: Kullanıcı Girişi
**Önkoşullar:**
- Geçerli kullanıcı hesabı
- Sistem erişilebilir durumda

**Test Adımları:**
1. Login sayfasına git
2. Geçerli email gir
3. Geçerli şifre gir
4. Giriş yap butonuna tıkla

**Beklenen Sonuç:**
- Başarılı giriş
- Dashboard'a yönlendirme
- JWT token oluşturulması

### TC-002: Hatalı Giriş
**Test Adımları:**
1. Geçersiz kimlik bilgileri ile giriş dene
2. Boş alanlarla giriş dene
3. SQL injection dene

## 📊 Dashboard Testleri

### TC-003: İstatistik Görüntüleme
**Test Adımları:**
1. Dashboard'a git
2. İstatistik widgetlarını kontrol et
3. Grafiklerin yüklenmesini bekle

**Doğrulama Noktaları:**
- Tüm istatistikler görünür
- Veriler doğru formatta
- Grafikler interaktif

## 📁 Proje Yönetimi Testleri

### TC-004: Yeni Proje Oluşturma
**Test Adımları:**
1. "Yeni Proje" butonuna tıkla
2. Tüm zorunlu alanları doldur
3. Konum seç
4. Kaydet

**Veri Seti:**
```json
{
  "name": "Test Projesi",
  "description": "Test açıklaması",
  "location": {
    "lat": 41.0082,
    "lng": 28.9784
  }
}
```

### TC-005: Proje Düzenleme
**Test Adımları:**
1. Mevcut projeyi seç
2. Düzenle butonuna tıkla
3. Bilgileri güncelle
4. Kaydet

## 🗺️ Harita Modülü Testleri

### TC-006: Harita Etkileşimleri
**Test Adımları:**
1. Harita görünümüne geç
2. Yakınlaştırma/uzaklaştırma
3. Proje işaretleyicilerine tıkla
4. Bölge seçimi yap

**Performans Kriterleri:**
- Harita yüklenme süresi < 3sn
- İşaretleyici tıklama yanıt süresi < 1sn

## 📄 Dosya İşlemleri Testleri

### TC-007: PDF Yükleme
**Test Adımları:**
1. Dosya yükleme alanına tıkla
2. PDF seç (max 50MB)
3. Yükle butonuna tıkla

**Test Dosyaları:**
- test_small.pdf (1MB)
- test_large.pdf (49MB)
- test_invalid.exe

### TC-008: Dosya Analizi
**Test Adımları:**
1. Yüklenen PDF'i seç
2. "Analiz Et" butonuna tıkla
3. AI işlem sonucunu bekle

## 🤖 AI Konsol Testleri

### TC-009: Otomatik Öneriler
**Test Adımları:**
1. Proje detayına git
2. AI önerilerini görüntüle
3. Öneri detaylarına tıkla

**Doğrulama:**
- Öneriler alakalı ve anlamlı
- Yanıt süresi < 5sn

## 👥 Kullanıcı Yönetimi Testleri

### TC-010: Kullanıcı Ekleme
**Test Adımları:**
1. Admin paneline git
2. "Yeni Kullanıcı" seç
3. Bilgileri gir
4. Rol ata
5. Kaydet

## 🔒 Güvenlik Testleri

### TC-011: XSS Koruması
**Test Verileri:**
```javascript
<script>alert('xss')</script>
```

### TC-012: CSRF Koruması
**Test Adımları:**
1. Token olmadan istek gönder
2. Geçersiz token ile istek gönder

## 📱 Responsive Tasarım Testleri

### TC-013: Mobil Uyumluluk
**Test Cihazları:**
- iPhone 12
- Samsung Galaxy S21
- iPad Pro

**Kontrol Noktaları:**
- Menü görünümü
- Form yerleşimi
- Harita kontrolü

## 🔄 Entegrasyon Testleri

### TC-014: API Entegrasyonu
**Test Adımları:**
1. Tüm endpoint'leri test et
2. Rate limiting kontrol et
3. Hata yanıtlarını doğrula

## 📊 Performans Testleri

### TC-015: Yük Testi
**Test Parametreleri:**
- 100 eşzamanlı kullanıcı
- 5 dakika süre
- 1000 istek/dakika

**Kabul Kriterleri:**
- Yanıt süresi < 2sn
- Hata oranı < %1
- CPU kullanımı < %80

## 📝 Test Sonuç Raporu

Her test senaryosu için aşağıdaki bilgiler kaydedilmelidir:

```markdown
| Test ID     | TC-XXX                    |
|-------------|---------------------------|
| Durum       | Başarılı/Başarısız       |
| Tarih       | YYYY-MM-DD               |
| Test Eden   | Ad Soyad                 |
| Sürüm       | v1.0.0                   |
| Notlar      | Varsa özel durumlar      |
```

## 🔄 Regresyon Test Listesi

Yeni sürüm öncesi kontrol edilecek kritik fonksiyonlar:

1. Kullanıcı girişi
2. Proje oluşturma
3. Dosya yükleme
4. PDF analizi
5. Harita fonksiyonları
6. Kullanıcı yönetimi
7. Yedekleme/geri yükleme 