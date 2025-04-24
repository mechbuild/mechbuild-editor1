// src/services/logVersionChange.js

import fs from "fs";
import path from "path";

export function logVersionChange(projectName, komut, sonuc) {
  const safeName = projectName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  const metaPath = `/mnt/data/projects/${safeName}/meta/versiyon.json`;

  const yeniKayit = {
    tarih: new Date().toISOString().replace("T", " ").slice(0, 16),
    komut,
    sonuc
  };

  let mevcutLog = [];
  if (fs.existsSync(metaPath)) {
    try {
      mevcutLog = JSON.parse(fs.readFileSync(metaPath));
    } catch (e) {
      mevcutLog = [];
    }
  }

  mevcutLog.push(yeniKayit);
  fs.writeFileSync(metaPath, JSON.stringify(mevcutLog, null, 2));

  return yeniKayit;
}
