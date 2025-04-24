// src/services/suggestNextSteps.js

export function suggestNextSteps(projectName, lastCommand) {
    const suggestions = [];
  
    if (lastCommand.includes("pdfolustur")) {
      suggestions.push("📤 Bu PDF'yi Google Drive'a yüklemek ister misin? Komut: push: öneri 1");
    }
    if (lastCommand.includes("revizeet")) {
      suggestions.push("📄 Revize BOQ için yeni PDF çıktısı oluşturalım mı? Komut: push: öneri 2");
    }
    if (lastCommand.includes("ozet")) {
      suggestions.push("🧠 Bu özetle birlikte bir Word raporu üretelim mi? Komut: push: öneri 3");
    }
    if (lastCommand.includes("yanitla")) {
      suggestions.push("📬 Bu cevabı .docx formatında indir veya e-posta ile yolla. Komut: push: öneri 4");
    }
  
    return suggestions;
  }
  