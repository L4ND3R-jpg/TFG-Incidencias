import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../NotificationBell';

export function TailAdminLayout({
  title,
  subtitle,
  activeTab,
  onTabChange,
  navItems = [],
  children,
}) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans text-slate-800 antialiased">
      {/* SIDEBAR CORPORATIVO OSCURO (Estilo TailAdmin: #1C2434) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#1C2434] transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo / Cabecera Sidebar */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Telefónica"
              className="h-10 w-10 rounded-lg object-cover shadow-md"
            />
            <div>
              <span className="text-lg font-bold text-white tracking-wide">Telefónica</span>
              <span className="block text-[11px] font-medium text-slate-400">Gestión de Red & Averías</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-slate-400 hover:text-white lg:hidden"
            aria-label="Cerrar menú"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navegación Sidebar */}
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
          <nav className="space-y-1">
            <p className="px-3 pb-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Menú Principal
            </p>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`group flex w-full items-center gap-3.5 rounded-lg px-3.5 py-3 text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <span className={`shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Pie de Sidebar con información de versión */}
        <div className="border-t border-slate-800 p-4">
          <div className="rounded-lg bg-slate-800/60 p-3 text-xs text-slate-400">
            <p className="font-semibold text-slate-300">Telefónica Ops v2.4</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Plataforma Operadora Fibra</p>
          </div>
        </div>
      </aside>

      {/* Backdrop en dispositivos móviles */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* ÁREA DE CONTENIDO */}
      <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        {/* HEADER SUPERIOR BLANCO */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 lg:hidden cursor-pointer"
              aria-label="Abrir menú"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">{title}</h1>
              {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
            </div>
          </div>

          {/* DERECHA: NOTIFICACIONES + PERFIL DE USUARIO */}
          <div className="flex items-center gap-4">
            <NotificationBell />

            <div className="h-6 w-px bg-slate-200" />

            {/* Menú de Usuario */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-3 text-left focus:outline-none cursor-pointer"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-white shadow-xs">
                  {user?.nombre?.slice(0, 2).toUpperCase() || 'US'}
                </div>
                <div className="hidden text-right md:block">
                  <span className="block text-xs font-bold text-slate-800">{user?.nombre}</span>
                  <span className="block text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                    {user?.rol}
                  </span>
                </div>
                <svg className="hidden h-4 w-4 text-slate-400 md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {userDropdownOpen && (
                <div
                  onMouseLeave={() => setUserDropdownOpen(false)}
                  className="absolute right-0 mt-3 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="border-b border-slate-100 px-4 py-2.5">
                    <p className="text-xs font-bold text-slate-800">{user?.nombre}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <span className="mt-1.5 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      Rol: {user?.rol}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
