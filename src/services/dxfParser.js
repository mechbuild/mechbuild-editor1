// src/services/dxfParser.js

import { read, parseStringPromise } from 'dxf-parser-lite';
import { AppError, handleError } from './errorHandler';

export async function parseDXFFile(file) {
  try {
    if (!file) {
      throw new AppError('DXF dosyası bulunamadı.', 'error', 400);
    }

    const text = await file.text();
    if (!text) {
      throw new AppError('DXF dosyası boş.', 'error', 400);
    }

    const dxfData = await parseStringPromise(text);
    if (!dxfData) {
      throw new AppError('DXF dosyası okunamadı.', 'error', 400);
    }

    const layers = {};
    const requiredLayers = ['Sprinkler', 'Legend', 'MechanicalRoom'];
    const missingLayers = [];

    if (!dxfData.entities) {
      throw new AppError('DXF dosyasında entity bulunamadı.', 'error', 400);
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

    // Kontrol edilmesi gereken katmanları kontrol et
    for (const requiredLayer of requiredLayers) {
      if (!layers[requiredLayer]) {
        missingLayers.push(requiredLayer);
      }
    }

    // Özel kontroller
    const notes = [];
    if (missingLayers.includes('Sprinkler')) {
      notes.push('⚠️ Sprinkler katmanı eksik.');
    }
    if (layers['Legend'] && !layers['Legend']['TEXT']) {
      notes.push('⚠️ Legend katmanında metin bulunamadı.');
    }
    if (layers['MechanicalRoom'] && !layers['MechanicalRoom']['POLYLINE']) {
      notes.push('⚠️ MechanicalRoom katmanında alan bilgisi eksik.');
    }

    return {
      status: true,
      layers,
      notes,
      count: Object.keys(layers).length,
      missingLayers
    };
  } catch (err) {
    return handleError(err);
  }
}
