# Excel Analiz API Dokümantasyonu

## Genel Bilgiler

Bu API, Excel dosyalarının analiz edilmesi ve raporlanması için kullanılır. Tüm istekler JWT token gerektirir.

### Base URL
```
https://api.example.com/v1
```

### Kimlik Doğrulama
Tüm API isteklerinde `Authorization` header'ında JWT token gönderilmelidir:
```
Authorization: Bearer <token>
```

## Endpoints

### 1. Dosya Yükleme ve Analiz

#### POST /api/upload
Excel dosyasını yükler ve analiz sürecini başlatır.

**Request:**
```http
POST /api/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <excel_file>
```

**Başarılı Yanıt:**
```json
{
  "operationId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "pending",
  "message": "Analiz başlatıldı"
}
```

### 2. İşlem Durumu Kontrolü

#### GET /api/operation/:operationId
Analiz işleminin durumunu kontrol eder.

**Request:**
```http
GET /api/operation/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <token>
```

**Başarılı Yanıt:**
```json
{
  "operationId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "completed",
  "progress": 100,
  "analysis": {
    "totalSheets": 3,
    "totalCells": 1500,
    "totalFormulas": 45,
    "sheets": [
      {
        "name": "Sheet1",
        "cellCount": 500,
        "formulaCount": 15,
        "charts": 2,
        "pivotTables": 1
      }
    ]
  }
}
```

### 3. Rapor Oluşturma

#### POST /api/export-analysis/:operationId
Analiz sonuçlarını belirtilen formatta dışa aktarır.

**Request:**
```http
POST /api/export-analysis/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json
Authorization: Bearer <token>

{
  "format": "pdf",
  "includeCharts": true,
  "includeFormulas": true,
  "includeStyles": true
}
```

**Başarılı Yanıt:**
```json
{
  "downloadUrl": "https://api.example.com/downloads/report-123.pdf",
  "expiresAt": "2024-03-20T12:00:00Z"
}
```

## Hata Kodları

| Kod | Açıklama |
|-----|----------|
| 400 | Geçersiz istek |
| 401 | Kimlik doğrulama gerekli |
| 403 | Yetkisiz erişim |
| 404 | Kaynak bulunamadı |
| 429 | Çok fazla istek |
| 500 | Sunucu hatası |

## Örnek Kullanım

### Dosya Yükleme
```javascript
const formData = new FormData();
formData.append('file', excelFile);

const response = await fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const { operationId } = await response.json();
```

### Durum Kontrolü
```javascript
const checkStatus = async (operationId) => {
  const response = await fetch(`/api/operation/${operationId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

### Rapor Oluşturma
```javascript
const generateReport = async (operationId) => {
  const response = await fetch(`/api/export-analysis/${operationId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      format: 'pdf',
      includeCharts: true,
      includeFormulas: true
    })
  });
  
  return await response.json();
};
```

## Güvenlik

- Tüm API istekleri HTTPS üzerinden yapılmalıdır
- JWT token'lar 1 saat sonra geçerliliğini yitirir
- Dosya yükleme boyutu maksimum 10MB ile sınırlıdır

## Rate Limiting

- IP başına dakikada maksimum 100 istek
- Dosya yükleme için günlük maksimum 50 istek

## Versiyonlama

API versiyonu URL'de belirtilir:
```
https://api.example.com/v1/...
```

## Destek

Sorularınız için: support@example.com 