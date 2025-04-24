// src/services/pushHandler.js

import { summarizeProject } from "./summarizeProject";
import { generateProjectPdf } from "./generateProjectPdf";
import { generateReplyFromAI } from "./generateReplyFromAI";
import { logVersionChange } from "./logVersionChange";
import { revertToVersion } from "./revertToVersion";
import { suggestNextSteps } from "./suggestNextSteps";
import { uploadToDrive } from "./uploadToDrive";
import { getMostFrequentCommand } from "./getMostFrequentCommand";
import { generateAllInOneReport } from "./generateAllInOneReport.js";
import { currentUser } from "../auth/session.js";
import { checkAccess } from "../auth/checkAccess.js";
import { explainCommand } from "./explainCommand.js";
import fs from "fs";

function withSuggestions(base, projectName, command) {
  const suggestions = suggestNextSteps(projectName, command);
  const explanation = explainCommand(command);
  const extendedMessage = `${base.message}\n\n📘 Açıklama:\n${explanation}`;
  if (suggestions.length > 0) {
    return {
      ...base,
      message: `${extendedMessage}\n\n💡 Öneriler:\n${suggestions.map((s, i) => `#${i + 1} ${s}`).join("\n")}`
    };
  }
  return {
    ...base,
    message: extendedMessage
  };
}

export async function pushHandler(command, projectName = "", projectOwner = "taner") {
  if (!checkAccess(command, projectOwner)) {
    return {
      type: "error",
      message: `🚫 Erişim engellendi. Kullanıcı '${currentUser.username}' bu işlem için yetkili değil.`
    };
  }

  const normalized = command.trim().toLowerCase();

  if (normalized === "push: beta test başlat") {
    const content = `✅ BETA TEST MODU AKTİF

- Tüm senaryolar otomatik tetiklenir
- Çıktılar birleştirilir ve karşılaştırılır
- AI açıklamalar teknik dil ve kullanıcı diline göre üretilir
- Proje tamamlandığında tüm çıktılar final zip klasörüne alınır

🧠 AI Test Yorumu:
MechBuild Editor tüm senaryoları başarıyla yürütüyor.`;

    const path = generateAllInOneReport(projectName, content);

    return {
      type: "info",
      message: `🧪 BETA testi başlatıldı.\n📥 [Beta Test Raporu indir](${path})`
    };
  }

  // diğer komutlar aynen devam...