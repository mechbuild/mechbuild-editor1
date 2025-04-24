// src/services/dxfParser.js

import { read, parseStringPromise } from 'dxf-parser-lite';

export async function parseDXFFile(file) {
  try {
    const text = await file.text();
    const dxfData = await parseStringPromise(text);
    const layers = {};

    if (!dxfData.entities) {
      return { error: "DXF dosyasında entity bulunamadı." };
    }

    for (const entity of dxfData.entities) {
      const layer = entity.layer || "Bilinmeyen";
      const type = entity.type;

      if (!layers[layer]) {
        layers[layer] = {};
      }
      if (!layers[layer][type]) {
        layers[layer][type] = 0;
      }

      layers[layer][type]++;
    }

    return { layers };
  } catch (err) {
    return { error: "DXF okuma hatası: " + err.message };
  }
}
