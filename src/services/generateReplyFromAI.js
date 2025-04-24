// src/services/generateReplyFromAI.js

export async function generateReplyFromAI(projectName = "", question = "") {
    const prompt = `Aşağıda bir mühendislik projesine ait teknik bir soru bulunmaktadır. Bu soruya yanıt verirken proje bağlamını dikkate al, ilgili normlara referans ver, açık, teknik, profesyonel ve ikna edici bir üslupla yaz. E-posta formatına uygun bir dille kısa bir cevap hazırla.
  
  Proje Adı: ${projectName}
  Soru: ${question}
  
  Yanıt:`;
  
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
            { role: "system", content: "Sen deneyimli bir teknik ofis mühendisisin ve her e-postayı teknik referanslarla birlikte yanıtlarsın." },
            { role: "user", content: prompt }
          ]
        })
      });
  
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "AI yanıtı alınamadı.";
    } catch (error) {
      return "AI bağlantı hatası: " + error.message;
    }
  }
  