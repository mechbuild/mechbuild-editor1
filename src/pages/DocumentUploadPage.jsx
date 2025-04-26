import React, { useRef, useState } from 'react';

export function DocumentUploadPage() {
  const fileInputRef = useRef();
  const [fileName, setFileName] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileName(file?.name);
    setMessage(file ? `✅ "${file.name}" başarıyla yüklendi.` : '⚠️ Dosya seçilmedi.');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    setFileName(file?.name);
    setMessage(file ? `✅ "${file.name}" başarıyla sürüklendi.` : '⚠️ Dosya seçilmedi.');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">📎 Döküman Yükleme</h1>
      <div
        className="border-2 border-dashed border-gray-400 rounded p-8 text-center bg-white shadow"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current.click()}
      >
        Dosya seçmek için tıklayın veya sürükleyin
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
