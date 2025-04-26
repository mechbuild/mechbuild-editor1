import React from 'react';
import { useUser } from '../context/UserContext.jsx';
import { Link } from 'react-router-dom';

export default function ProjectListPage() {
  const { user, logout } = useUser();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projeler</h1>
        <button onClick={logout} className="text-red-600 underline">Çıkış Yap</button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 shadow hover:bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">Proje 1</h2>
          <p className="text-gray-600 mb-4">Proje açıklaması buraya gelecek</p>
          <div className="flex gap-2">
            <Link to="/project/1/ai" className="text-blue-600 hover:text-blue-800">
              AI Konsol
            </Link>
            <Link to="/project/1/documents" className="text-green-600 hover:text-green-800">
              Dökümanlar
            </Link>
            <Link to="/project/1/outputs" className="text-purple-600 hover:text-purple-800">
              Çıktılar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
