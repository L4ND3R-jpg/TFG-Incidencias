import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../services/api';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const count = await apiFetch('/notificaciones/no-leidas/count');
      setUnreadCount(typeof count === 'number' ? count : 0);
    } catch {
      // Ignorar errores silenciosos en polling
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/notificaciones');
      setNotifications(data || []);
    } catch {
      // Ignorar
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications();
      fetchUnreadCount();
    }
    setIsOpen(!isOpen);
  };

  const markAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await apiFetch(`/notificaciones/${id}/leida`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignorar
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiFetch('/notificaciones/leer-todas', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
      setUnreadCount(0);
    } catch {
      // Ignorar
    }
  };

  const formatFecha = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
        title="Notificaciones"
        aria-label="Ver notificaciones"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse shadow-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-800">Notificaciones</span>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} nuevas
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Cargando notificaciones...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-xs text-slate-700 font-semibold">Sin notificaciones pendientes</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Estás al día con todos los avisos.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={(e) => !n.leida && markAsRead(n.id, e)}
                  className={`p-3 text-xs transition cursor-pointer flex items-start gap-2.5 ${
                    !n.leida
                      ? 'bg-indigo-50/50 hover:bg-indigo-50 border-l-3 border-indigo-600'
                      : 'bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`font-semibold truncate ${!n.leida ? 'text-indigo-950 font-bold' : 'text-slate-700'}`}>
                        {n.titulo}
                      </p>
                      {n.fechaCreacion && (
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatFecha(n.fechaCreacion)}
                        </span>
                      )}
                    </div>
                    <p className={`mt-0.5 text-[11px] leading-relaxed break-words ${!n.leida ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                      {n.mensaje}
                    </p>
                  </div>
                  {!n.leida && (
                    <button
                      onClick={(e) => markAsRead(n.id, e)}
                      title="Marcar como leída"
                      className="text-primary hover:text-primary/80 p-1 shrink-0 rounded hover:bg-slate-100 transition"
                    >
                      <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
