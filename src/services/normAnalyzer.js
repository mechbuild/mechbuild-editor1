// src/services/normAnalyzer.js

export async function analyzeSpecFileAI(analysis, projectName = "") {
    const prompt = `Bir teknik şartname dosyası sisteme yüklendi.
  Proje Adı: ${projectName}
  
  Dosya Adı: ${analysis.name}
  Tür: ${analysis.category}
  Açıklama: ${analysis.description}
  Boyut: ${analysis.sizeKB} KB
  
  Bu dosyada hangi teknik standartlar (ör. NFPA, EN, TSE) aranmalıdır? AI olarak öneri, eksik kontrolü ve norm uyumsuzluğu açısından öneride bulun.`;
  
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
            { role: "system", content: "Sen teknik şartname incelemesi yapan bir mühendis AI'sın." },
            { role: "user", content: prompt }
          ]
        })
      });
  
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "AI norm analizi alınamadı.";
    } catch (error) {
      return "AI bağlantı hatası: " + error.message;
    }
  }
  