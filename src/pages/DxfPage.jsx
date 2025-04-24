// src/pages/DxfPage.jsx

import React, { useState } from "react";
import UploadDxf from "../components/UploadDxf";
import DXFConsole from "../components/DXFConsole";
import { parseDxfFile } from "../services/parseDxfFile";

export default function DxfPage() {
  const [layers, setLayers] = useState([]);
  const [notes, setNotes] = useState([]);
  const [filename, setFilename] = useState("");

  const handleAnalyze = (filePath) => {
    const result = parseDxfFile(filePath);
    if (result.status) {
      setLayers(result.layers);
      setNotes(result.notes);
      setFilename(filePath);
    } else {
      alert("❌ DXF dosyası okunamadı.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">📐 DXF Katman Analizi Paneli</h1>
      <UploadDxf onAnalyze={handleAnalyze} />
      <DXFConsole filename={filename} layers={layers} notes={notes} />
    </div>
  );
}
