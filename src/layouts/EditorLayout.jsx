// src/layouts/EditorLayout.jsx

import React, { useState } from "react";
import { pushHandler } from "../services/pushHandler";
import FileUploader from "../components/FileUploader";
import { analyzeFile } from "../services/fileAnalyzer";
import { askAIFromFileAnalysis } from "../services/openai";
import { parseDXFFile } from "../services/dxfParser";
import { askAIFromDXF } from "../services/askAIFromDXF";
import { analyzeSpecFileAI } from "../services/normAnalyzer";
import { useUser } from "../context/UserContext";
import { createProjectStructure } from "../services/projectManager";
import { uploadToDrive } from "../services/uploadToDrive";

export default function EditorLayout() {
  const { user, logout } = useUser();
  const [command, setCommand] = useState("");
  const [result, setResult] = useState(null);
  const [files, setFiles] = useState([]);
  const [fileAnalysis, setFileAnalysis] = useState(null);
  const [aiResponse, setAiResponse] = useState(null);
  const [dxfInsight, setDxfInsight] = useState(null);
  const [normInsight, setNormInsight] = useState(null);
  const [projectName, setProjectName] = useState("Hotel_Taskent");

  const projectPaths = createProjectStructure(projectName);

  const handlePush = async () => {
    const response = await pushHandler(command);
    setResult(response);
  };

  const handleDeleteFile = (filename) => {
    setFiles((prev) => prev.filter((f) => f !== filename));
    setResult({
      type: "warning",
      message: `❌ ${filename} dosyası silindi.`
    });
  };

  const handlePublish = async () => {
    const link = await uploadToDrive(projectPaths.zip, projectName);
    setResult({
      type: "info",
      message: `✅ Proje çıktıları yayınlandı.\n${link}`
    });
  };

  const handleFileUpload = async (file) => {
    setFiles((prev) => [...prev, file.name]);
    const analysis = analyzeFile(file);
    setFileAnalysis(analysis);
    const aiInfo = await askAIFromFileAnalysis(analysis, projectName);
    setAiResponse(aiInfo);

    if (analysis.extension === "dxf") {
      const dxfData = await parseDXFFile(file);
      if (!dxfData.error) {
        const aiDXF = await askAIFromDXF(dxfData, projectName);
        setDxfInsight(aiDXF);
      } else {
        setDxfInsight("DXF analizi sırasında hata oluştu: " + dxfData.error);
      }
    } else {
      setDxfInsight(null);
    }

    if (analysis.extension === "docx" && analysis.category.includes("Şartname")) {
      const normAI = await analyzeSpecFileAI(analysis, projectName);
      setNormInsight(normAI);
    } else {
      setNormInsight(null);
    }
  };

  return (
    <div className="grid grid-cols-12 h-screen">
      {/* Sidebar */}
      <aside className="col-span-2 bg-gray-900 text-white p-4">
        <h2 className="text-lg font-bold mb-2">📁 Proje: {projectName}</h2>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="w-full text-xs mb-3 px-2 py-1 rounded bg-gray-800 text-white border border-gray-700"
        />

        <ul className="space-y-2 text-sm">
          {files.map((file, index) => (
            <li key={index} className="hover:text-blue-400 cursor-pointer flex justify-between items-center">
              <span>{file}</span>
              {user.role === "admin" && (
                <button
                  className="text-red-400 text-xs ml-2 hover:text-red-600"
                  onClick={() => handleDeleteFile(file)}
                >
                  [Sil]
                </button>
              )}
            </li>
          ))}
        </ul>

        {user.role === "admin" && (
          <div className="mt-6 text-xs">
            <p className="mb-1 text-gray-400">Admin Paneli</p>
            <button onClick={handlePublish} className="bg-purple-700 w-full text-white py-1 rounded hover:bg-purple-800 mb-2 text-xs">
              📤 Çıktıları Yayınla
            </button>
            <button className="bg-red-600 w-full text-white py-1 rounded hover:bg-red-700 text-xs" onClick={logout}>
              🔒 Oturumu Kapat
            </button>
          </div>
        )}
      </aside>

      {/* Main Viewer */}
      <main className="col-span-7 bg-gray-100 p-6 overflow-y-scroll">
        <h1 className="text-xl font-bold mb-2">📄 Document Viewer</h1>
        <div className="bg-white rounded-xl p-4 shadow-xl font-mono text-sm">
          <pre>
{`"KACIS HOLU" not found in SprinklerLayer.
NFPA 13 standard requires sprinkler presence in exit corridors.
Suggested Action: push: rfiOlustur`}
          </pre>
        </div>

        <div className="mt-6">
          <FileUploader onFileUpload={handleFileUpload} />
        </div>
      </main>

      {/* AI Console */}
      <section className="col-span-3 bg-white border-l p-4 flex flex-col">
        <h2 className="text-lg font-semibold mb-2">🤖 AI Konsolu</h2>

        {fileAnalysis && (
          <div className="bg-yellow-50 p-3 rounded-md text-xs mb-4 border-l-4 border-yellow-500 text-yellow-700">
            <p><strong>Yeni Dosya Yüklendi:</strong> {fileAnalysis.name}</p>
            <p><strong>Tür:</strong> {fileAnalysis.category}</p>
            <p><strong>Açıklama:</strong> {fileAnalysis.description}</p>
            <p><strong>Boyut:</strong> {fileAnalysis.sizeKB} KB</p>
          </div>
        )}

        {aiResponse && (
          <div className="bg-green-50 p-3 rounded-md text-xs mb-4 border-l-4 border-green-500 text-green-700 whitespace-pre-wrap">
            <p><strong>🧠 AI Açıklaması:</strong></p>
            <p>{aiResponse}</p>
          </div>
        )}

        {dxfInsight && (
          <div className="bg-blue-50 p-3 rounded-md text-xs mb-4 border-l-4 border-blue-500 text-blue-700 whitespace-pre-wrap">
            <p><strong>📐 DXF Teknik Yorum:</strong></p>
            <p>{dxfInsight}</p>
          </div>
        )}

        {normInsight && (
          <div className="bg-purple-50 p-3 rounded-md text-xs mb-4 border-l-4 border-purple-500 text-purple-700 whitespace-pre-wrap">
            <p><strong>📜 Norm Uyumu AI Açıklaması:</strong></p>
            <p>{normInsight}</p>
          </div>
        )}

        {result && (
          <div
            className={`bg-gray-100 p-3 rounded-md text-xs mb-4 border-l-4 ${
              result.type === "error"
                ? "border-red-500 text-red-700"
                : result.type === "warning"
                ? "border-yellow-500 text-yellow-700"
                : result.type === "rfi"
                ? "border-blue-500 text-blue-700"
                : "border-green-500 text-green-700"
            }`}
          >
            <p>{result.message}</p>
          </div>
        )}

        <input
          type="text"
          placeholder="Komut gir (ör. push: hesapla)"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm focus:outline-none"
        />
        <button
          onClick={handlePush}
          className="mt-3 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Çalıştır
        </button>
      </section>
    </div>
  );
}
