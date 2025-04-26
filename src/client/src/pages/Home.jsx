import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const menuItems = [
    {
      title: 'Projeler',
      description: 'Proje listesini görüntüle ve yönet',
      icon: 'folder_open',
      path: '/projects',
      color: '#4CAF50'
    },
    {
      title: 'Yedekle',
      description: 'Veritabanı yedekleme işlemleri',
      icon: 'backup',
      path: '/backup',
      color: '#2196F3'
    },
    {
      title: 'Geri Yükle',
      description: 'Yedekten veri geri yükleme',
      icon: 'restore',
      path: '/restore',
      color: '#FF9800'
    },
    {
      title: 'Çıkış Yap',
      description: 'Oturumu sonlandır',
      icon: 'logout',
      onClick: handleLogout,
      color: '#f44336'
    }
  ];

  return (
    <div className="home-container">
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      <h1 className="home-title">Hoş Geldiniz</h1>
      <div className="menu-grid">
        {menuItems.map((item, index) => (
          <div
            key={index}
            className="menu-card"
            onClick={item.onClick || (() => navigate(item.path))}
            style={{ '--hover-color': item.color }}
          >
            <div className="icon-container" style={{ color: item.color }}>
              <span className="material-icons" style={{ fontSize: '2.5rem' }}>
                {item.icon}
              </span>
            </div>
            <h2 className="card-title">{item.title}</h2>
            <p className="card-description">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home; 