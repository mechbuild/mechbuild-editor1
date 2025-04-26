import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { AppError, handleError } from '../services/errorHandler';

const PDFAnalysis = () => {
  const { project } = useProject();
  const [file, setFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) {
      setError('Lütfen bir dosya seçin.');
      setFile(null);
      return;
    }

    if (selectedFile.type !== 'application/pdf') {
      setError('Sadece PDF dosyaları yüklenebilir.');
      setFile(null);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      setError('Dosya boyutu 10MB\'dan büyük olamaz.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setAnalysisResult(null);
  };

  const handleAnalysis = async () => {
    if (!file) {
      setError('Lütfen önce bir PDF dosyası yükleyin.');
      return;
    }

    if (!project?.id) {
      setError('Proje seçili değil.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('projectId', project.id);

    try {
      const response = await fetch('http://localhost:3001/api/analyze-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new AppError(errorData.error || 'PDF analizi başarısız oldu.', 'error', response.status);
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err) {
      setError(handleError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">🧠 PDF Analiz</h2>
      
      <div className="mb-4">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <button
        onClick={handleAnalysis}
        disabled={!file || loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Analiz Ediliyor...' : '🧠 PDF Analiz'}
      </button>

      {analysisResult && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Analiz Sonucu:</h3>
          <div className="space-y-2">
            <p><strong>Sayfa Sayısı:</strong> {analysisResult.analysis.pageCount}</p>
            <p><strong>Metin Uzunluğu:</strong> {analysisResult.analysis.textLength} karakter</p>
            <div className="mt-2">
              <h4 className="font-medium">Bulunan Anahtar Kelimeler:</h4>
              <ul className="list-disc list-inside">
                {Object.entries(analysisResult.analysis.keywordsFound).map(([keyword, found]) => (
                  <li key={keyword} className={found ? 'text-green-600' : 'text-gray-500'}>
                    {keyword}: {found ? '✅ Bulundu' : '❌ Bulunamadı'}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFAnalysis; 