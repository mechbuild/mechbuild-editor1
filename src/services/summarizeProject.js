// src/services/summarizeProject.js

export async function summarizeProject(projectName = "") {
    const prompt = `Bir mühendislik projesi kapsamında aşağıdaki dosyalar işlendi:
  
  Proje Adı: ${projectName}
  
  1. hesap_sonuclari_v2.xlsx → Havalandırma debisi ve ısı kazancı hesapları
  2. revize_raporu.docx → BOQ'da %5 → %8 fire revizyonu
  3. RFI_008_clean.pdf → Kaçış holünde sprinkler eksikliği bildirimi (NFPA 13)
  4. uyusmazlik_log.txt → Teknik loglama ve uyuşmazlık notları
  
  Yukarıdaki çıktılara göre bu projeye özel bir teknik özet hazırla:
  - Ne tür sistemler işlendi?
  - Hangi sorunlar tespit edildi?
  - Hangi revizyonlar ve teknik dokümanlar üretildi?
  - AI çıktısı hangi mühendislik kararlarına katkı sağladı?
  
  Kısa, öz, maddeler halinde ve teknik dilde yaz.`;
  
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            { role: "system", content: "Sen bir teknik proje danışmanı mühendis AI'sın." },
            { role: "user", content: prompt }
          ]
        })
      });
  
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "AI proje özeti alınamadı.";
    } catch (error) {
      return "AI bağlantı hatası: " + error.message;
    }
  }
  