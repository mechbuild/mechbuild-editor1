// src/services/getMostFrequentCommand.js

import fs from "fs";

export function getMostFrequentCommand(projectName) {
  const safeName = projectName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  const metaPath = `/mnt/data/projects/${safeName}/meta/versiyon.json`;

  if (!fs.existsSync(metaPath)) return null;

  const logs = JSON.parse(fs.readFileSync(metaPath));
  const frekans = {};

  logs.forEach(log => {
    const cmd = log.komut.trim().toLowerCase();
    if (!frekans[cmd]) frekans[cmd] = 0;
    frekans[cmd]++;
  });

  const sorted = Object.entries(frekans).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : null;
}
