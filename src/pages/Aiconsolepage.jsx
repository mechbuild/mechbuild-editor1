import React, { useState } from 'react';

export function AIConsolePage() {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState('');

  const handleRun = () => {
    if (command.trim() === '') return;
    setOutput(`🔍 AI yanıtı: "${command}" komutu analiz edildi.`);
    setCommand('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">🤖 AI Komut Konsolu</h1>
      <input
        type="text"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="Bir komut girin..."
        className="border border-gray-300 rounded p-2 w-full mb-2"
      />
      <button
        onClick={handleRun}
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
      >
        Çalıştır
      </button>
      <div className="bg-white p-4 rounded shadow mt-4">
        <strong>Çıktı:</strong>
        <p className="text-gray-700 whitespace-pre-wrap">{output || 'Henüz çıktı yok...'}</p>
      </div>
    </div>
  );
}
