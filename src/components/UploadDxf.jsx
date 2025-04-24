// src/components/UploadDxf.jsx

import React, { useState } from "react";

export default function UploadDxf({ onAnalyze }) {
  const [filePath, setFilePath] = useState("");

  const handleChange = (e) => {
    setFilePath(e.target.value);
  };

  const handleAnalyzeClick = () => {
    if (!filePath.endsWith(".dxf")) {
      alert("Sadece .dxf uzantılı dosyalar desteklenir.");
      return;
    }
    onAnalyze(filePath);
  };

  return (
    <div className="mb-4">
      <label className="block font-semibold mb-2">DXF Dosya Yolu:</label>
      <input
        type="text"
        value={filePath}
        onChange={handleChange}
        placeholder="Örn: /mnt/data/cizim1.dxf"
        className="border border-gray-300 rounded px-3 py-2 w-full"
      />
      <button
        onClick={handleAnalyzeClick}
        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
      >
        📊 Analiz Et
      </button>
    </div>
  );
}
