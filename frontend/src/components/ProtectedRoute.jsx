import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-xl shadow-md border border-red-200 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Acceso no autorizado</h2>
        <p className="text-slate-600 mb-4">No tienes los permisos necesarios para acceder a este panel ({user.rol}).</p>
        <Navigate to="/login" replace />
      </div>
    );
  }

  return children;
}
