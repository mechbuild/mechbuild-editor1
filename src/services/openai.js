// src/services/openai.js

export async function askAIFromFileAnalysis(analysis, projectName = "") {
    const prompt = `Bir mühendislik projesi kapsamında dosya yüklendi:
  
  Proje: ${projectName}
  Dosya Adı: ${analysis.name}
  Tür: ${analysis.category}
  Açıklama: ${analysis.description}
  Boyut: ${analysis.sizeKB} KB
  
  Bu dosya ne işe yarar? Hangi sistemlerde kullanılır? Sistem ne tür AI işlemleri yapabilir? Açıklayıcı, kısa ve teknik bir şekilde yanıtla.`;
  
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
            { role: "system", content: "Sen teknik döküman uzmanı bir mühendis AI'sın." },
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