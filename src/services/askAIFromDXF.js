// src/services/askAIFromDXF.js

export async function askAIFromDXF(dxfAnalysis, projectName = "") {
    const summary = Object.entries(dxfAnalysis.layers || {})
      .map(([layer, types]) => {
        const entries = Object.entries(types)
          .map(([type, count]) => `${type}: ${count}`)
          .join(", ");
        return `Katman: ${layer} → ${entries}`;
      })
      .join("\n");
  
    const prompt = `Bir mühendislik çizimi olan DXF dosyası analiz edildi.
  Proje: ${projectName}
  Aşağıda her katmandaki obje türleri ve sayıları yer almaktadır:
  
  ${summary}
  
  Bu verilere göre AI olarak teknik yorum yap:
  - Sprinkler eksikliği var mı?
  - Mahal isimleri yeterli mi?
  - NFPA veya EN normlarına göre teknik önerin nedir?
  - Gerekirse RFI veya revizyon önerisi sun.`;
  
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
            { role: "system", content: "Sen teknik çizim uzmanı bir mühendis AI'sın." },
            { role: "user", content: prompt }
          ]
        })
      });
  
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "AI açıklaması alınamadı.";
    } catch (error) {
      return "AI bağlantı hatası: " + error.message;
    }
  }