import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ClienteDashboard } from './pages/ClienteDashboard';
import { TecnicoDashboard } from './pages/TecnicoDashboard';
import { GestorDashboard } from './pages/GestorDashboard';

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  switch (user.rol) {
    case 'CLIENTE':
      return <Navigate to="/cliente" replace />;
    case 'TECNICO':
      return <Navigate to="/tecnico" replace />;
    case 'GESTOR':
      return <Navigate to="/gestor" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />

            <Route
              path="/cliente/*"
              element={
                <ProtectedRoute allowedRoles={['CLIENTE']}>
                  <ClienteDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tecnico/*"
              element={
                <ProtectedRoute allowedRoles={['TECNICO']}>
                  <TecnicoDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/gestor/*"
              element={
                <ProtectedRoute allowedRoles={['GESTOR']}>
                  <GestorDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
