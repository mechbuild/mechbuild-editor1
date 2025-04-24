// src/components/DXFConsole.jsx

import React from "react";

export default function DXFConsole({ filename, layers, notes }) {
  if (!filename) return null;

  return (
    <div className="bg-gray-100 p-4 rounded shadow">
      <h2 className="text-lg font-bold mb-2">📁 Dosya: {filename}</h2>

      <div className="mb-3">
        <h3 className="font-semibold">🔎 Bulunan Katmanlar ({layers.length}):</h3>
        <ul className="list-disc ml-6">
          {layers.map((layer, i) => (
            <li key={i}>{layer}</li>
          ))}
        </ul>
      </div>

      {notes.length > 0 && (
        <div>
          <h3 className="font-semibold text-red-600">⚠️ AI Uyarıları:</h3>
          <ul className="list-disc ml-6 text-red-600">
            {notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
