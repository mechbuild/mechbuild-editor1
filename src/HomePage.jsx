// src/pages/HomePage.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ZoneTable from "../components/ZoneTable";

export default function HomePage() {
  const [project, setProject] = useState("");
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState("");
  const [history, setHistory] = useState([]);
  const [files, setFiles] = useState([]);

  const handlePush = () => {
    if (!command.startsWith("push:")) {
      setOutput("❗ Lütfen 'push:' ile başlayan bir komut girin.");
      return;
    }
    const result = `✅ ${command} komutu çalıştırıldı.\n📘 AI açıklaması burada görünecek.`;
    setOutput(result);
    const fileBase = `/mnt/data/projects/${project.replace(/\s+/g, "_")}/meta/${project.replace(/\s+/g, "_")}_Beta_Test_Raporu`;
    setHistory(prev => [
      { cmd: command, msg: result, file: `${fileBase}.docx` },
      ...prev
    ]);
    setFiles([`${fileBase}.docx`, `${fileBase}.pdf`, `${fileBase}.txt`, `${fileBase}.zip`]);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">MechBuild Web Konsolu</h1>

      <div className="mb-4">
        <Input
          placeholder="Proje adı girin..."
          value={project}
          onChange={(e) => setProject(e.target.value)}
        />
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="push: hesapla"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
        />
        <Button onClick={handlePush}>Gönder</Button>
      </div>

      <div className="bg-white p-4 rounded shadow text-sm whitespace-pre-wrap mb-6">
        {output || "📭 Henüz bir çıktı yok."}
      </div>

      <div className="bg-white p-4 rounded shadow text-sm mb-6">
        <h2 className="text-lg font-semibold mb-2">📜 Komut Geçmişi</h2>
        {history.length === 0 ? (
          <p>Henüz bir komut çalıştırılmadı.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((h, idx) => (
              <li key={idx} className="border-b pb-2">
                <div className="font-mono">{h.cmd}</div>
                <div className="text-green-700">{h.msg}</div>
                <a href={h.file} className="text-blue-600 underline" download>
                  📥 Çıktıyı indir (Word)
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white p-4 rounded shadow text-sm mb-6">
        <h2 className="text-lg font-semibold mb-2">📂 Dosya Çıktıları</h2>
        {files.length === 0 ? (
          <p>Henüz dosya üretilmedi.</p>
        ) : (
          <ul className="list-disc list-inside">
            {files.map((file, idx) => (
              <li key={idx}>
                <a href={file} className="text-blue-600 underline" download>
                  📄 {file.split("/").pop()}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ZoneTable />
    </div>
  );
}