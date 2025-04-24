// src/services/parseDxfFile.js

import fs from "fs";
import path from "path";

export function parseDxfFile(filepath) {
  if (!fs.existsSync(filepath)) {
    return { status: false, message: "DXF dosyası bulunamadı." };
  }

  const content = fs.readFileSync(filepath, "utf8");
  const layerRegex = /LAYER\s+NAME\s+(.+?)\s/gi;
  const found = new Set();
  let match;

  while ((match = layerRegex.exec(content)) !== null) {
    found.add(match[1].trim());
  }

  const layers = Array.from(found);

  const notes = [];
  if (!layers.includes("Sprinkler")) {
    notes.push("⚠️ Sprinkler katmanı eksik.");
  }
  if (layers.includes("Legend") && content.includes("Legend") && content.split("Legend").length < 3) {
    notes.push("⚠️ Legend katmanı boş veya eksik.");
  }
  if (layers.includes("MechanicalRoom") && !content.includes("AREA")) {
    notes.push("⚠️ MechanicalRoom katmanı var ama alan bilgisi eksik olabilir.");
  }

  return {
    status: true,
    layers,
    notes,
    count: layers.length
  };
}
