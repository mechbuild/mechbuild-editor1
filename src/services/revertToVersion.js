// src/services/revertToVersion.js

import fs from "fs";

export function revertToVersion(projectName, index) {
  const safeName = projectName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  const metaPath = `/mnt/data/projects/${safeName}/meta/versiyon.json`;

  if (!fs.existsSync(metaPath)) {
    return { status: false, message: "Versiyon geçmişi bulunamadı." };
  }

  const loglar = JSON.parse(fs.readFileSync(metaPath));
  if (index < 1 || index > loglar.length) {
    return { status: false, message: `Geçersiz versiyon numarası. [1-${loglar.length}] aralığında olmalı.` };
  }

  const yeniLog = loglar.slice(0, index);
  fs.writeFileSync(metaPath, JSON.stringify(yeniLog, null, 2));

  return {
    status: true,
    message: `⏪ Geri alma tamamlandı. Proje ${index}. versiyona döndürüldü.\n📅 ${yeniLog[index - 1].tarih} | ${yeniLog[index - 1].komut}`
  };
}
