// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext.jsx';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

function AppRoutes() {
  const { user } = useUser();

  return (
    <Routes>
      {/* Public route: Login page */}
      <Route path="/login" element={<LoginPage />} />
      {/* Protected route: Home page (requires login) */}
      <Route 
        path="/" 
        element={user ? <HomePage /> : <Navigate to="/login" replace />} 
      />
      {/* Catch-all route: redirect to appropriate page based on login status */}
      <Route 
        path="*" 
        element={<Navigate to={user ? "/" : "/login"} replace />} 
      />
    </Routes>
  );
}

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
