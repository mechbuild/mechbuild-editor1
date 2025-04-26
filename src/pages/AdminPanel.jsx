import React from 'react';
import { useUser } from '../context/UserContext.jsx';
import { Link } from 'react-router-dom';

export default function AdminPanel() {
  const { user, logout } = useUser();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <button onClick={logout} className="text-red-600 underline">Çıkış Yap</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/projects" className="border rounded-lg p-4 shadow hover:bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">Projeler</h2>
          <p className="text-gray-600">Projelerinizi yönetin</p>
        </Link>

        <div className="border rounded-lg p-4 shadow">
          <h2 className="text-xl font-semibold mb-2">Dosyalar</h2>
          <p className="text-gray-600">Dosyalarınızı yönetin</p>
        </div>

        <div className="border rounded-lg p-4 shadow">
          <h2 className="text-xl font-semibold mb-2">Ayarlar</h2>
          <p className="text-gray-600">Hesap ayarlarınızı yönetin</p>
        </div>
      </div>
    </div>
  );
}
