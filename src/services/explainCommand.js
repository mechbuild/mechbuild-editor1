// src/services/explainCommand.js

export function explainCommand(command) {
    const map = {
      "push: hesapla": `Bu komut ile mahal bazlı ısı kazancı ve debi hesabı yapılır.\nNormlar: TS 825, ASHRAE 55\nYöntem: Alan x sıcaklık farkı x ısı iletim katsayısı kullanılır.`,
  
      "push: pdfolustur": `Yapılan hesaplar özetlenerek PDF formatında sunulur.\nRapor formatı EN ISO 16739 (IFC) ve PDF/A standardına uygundur.`,
  
      "push: ozet": `Projenin tüm teknik çıktıları AI tarafından özetlenir.\nGiriş verileri, hesaplar ve sonuçlar sade bir dille aktarılır.`,
  
      "push: rfiolustur": `Projede tespit edilen uyuşmazlıkları belgelemek için kullanılır.\nBu komut bir “Request for Information” (RFI) dokümanı oluşturur.`,
  
      "push: revizeet": `BOQ ve teknik hesaplamalardaki güncellemeleri revize eder.\nRevizyon sonrası fire, oran ve malzeme listeleri yeniden hesaplanır.`,
  
      "push: exportall": `Tüm hesap, çıktı ve belgeler .zip arşiv dosyası halinde dışa aktarılır.`
    };
  
    return map[command.trim().toLowerCase()] || "📘 Bu komut için henüz açıklama eklenmedi.";
  }