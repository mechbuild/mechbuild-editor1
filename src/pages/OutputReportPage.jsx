import React, { useState } from 'react';

export function OutputReportPage() {
  const [outputs, setOutputs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState('');
  const documents = ['Proje Hesaplama.xlsx', 'Yangın Raporu.docx', 'HVAC Analizi.pdf'];

  const handleCreateOutput = () => {
    if (!selectedDoc) return;
    setOutputs([{ id: Date.now(), fileName: selectedDoc, createdAt: new Date().toLocaleString() }, ...outputs]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">📤 Çıktı ve Rapor Üretimi</h1>
      <select
        className="border border-gray-300 rounded p-2 w-full mb-2"
        value={selectedDoc}
        onChange={(e) => setSelectedDoc(e.target.value)}
      >
        <option value="">📂 Döküman seçin...</option>
        {documents.map((doc) => <option key={doc} value={doc}>{doc}</option>)}
      </select>
      <button
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        onClick={handleCreateOutput}
      >
        Çıktı Oluştur
      </button>
      <div className="bg-white p-4 rounded shadow mt-4">
        <h2 className="font-semibold mb-2">🗃️ Oluşturulan Çıktılar</h2>
        {outputs.length ? outputs.map((o) => (
          <p key={o.id}>📄 <strong>{o.fileName}</strong> - <span className="text-gray-600">{o.createdAt}</span></p>
        )) : <p className="text-gray-500">Henüz çıktı oluşturulmadı.</p>}
      </div>
    </div>
  );
}
