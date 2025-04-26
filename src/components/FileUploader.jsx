import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { AppError, handleError, errorTypes } from '../services/errorHandler';

export default function FileUploader({ onFileUpload, onError }) {
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const error = new AppError(
        'Geçersiz dosya türü veya boyutu',
        errorTypes.FILE,
        400
      );
      onError(handleError(error));
      return;
    }

    if (acceptedFiles.length > 0) {
      try {
        onFileUpload(acceptedFiles[0]);
      } catch (error) {
        onError(handleError(error));
      }
    }
  }, [onFileUpload, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/dxf': ['.dxf']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-2">
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        {isDragActive ? (
          <p className="text-blue-500 font-medium">Dosyayı buraya bırakın...</p>
        ) : (
          <>
            <p className="text-gray-600 font-medium">
              Dosyayı sürükleyip bırakın veya tıklayarak seçin
            </p>
            <p className="text-gray-500 text-sm">
              PDF, DOCX, XLSX veya DXF dosyaları (max. 10MB)
            </p>
          </>
        )}
      </div>
    </div>
  );
} 