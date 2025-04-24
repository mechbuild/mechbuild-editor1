// src/services/generateAllInOneReport.js

import fs from "fs";

export function generateAllInOneReport(projectName, content) {
  const safeName = projectName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  const metaDir = `/mnt/data/projects/${safeName}/meta`;
  if (!fs.existsSync(metaDir)) fs.mkdirSync(metaDir, { recursive: true });

  const finalText = `
MECHBUILD FINAL RAPORU
=======================

Proje Adı: ${projectName}
Tarih: ${new Date().toLocaleDateString()}

${content}

Hazırlayan: MechBuild Editor + AI Konsol
`;

  const path = `${metaDir}/${safeName}_AllInOne_Final_Rapor.docx`;
  fs.writeFileSync(path, finalText);

  return path;
}