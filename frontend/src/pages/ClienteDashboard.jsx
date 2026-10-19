import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../services/api';
import { TailAdminLayout } from '../components/layout/TailAdminLayout';

export function ClienteDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal para Crear Incidencia
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState('AVERIA');
  const [direccion, setDireccion] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState(user?.telefono || '');
  const [descripcion, setDescripcion] = useState('');
  const [fechaCita, setFechaCita] = useState('');
  const [franja, setFranja] = useState('MANANA');
  const [horaInicioEstimada, setHoraInicioEstimada] = useState('10:00:00');
  const [duracionEstimadaMinutos, setDuracionEstimadaMinutos] = useState(90);
  const [creando, setCreando] = useState(false);
  const [crearError, setCrearError] = useState('');

  // Modal para Reprogramar Incidencia en STAND_BY
  const [incidenciaReprog, setIncidenciaReprog] = useState(null);
  const [reprogFecha, setReprogFecha] = useState('');
  const [reprogFranja, setReprogFranja] = useState('MANANA');
  const [reprogHora, setReprogHora] = useState('');
  const [huecosLibres, setHuecosLibres] = useState([]);
  const [cargandoHuecos, setCargandoHuecos] = useState(false);
  const [reprogramando, setReprogramando] = useState(false);
  const [reprogError, setReprogError] = useState('');

  const cargarIncidencias = async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      const data = await apiFetch('/incidencias');
      setIncidencias(data || []);
    } catch (err) {
      if (!silencioso) setError(err.message || 'Error al cargar las incidencias');
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  useEffect(() => {
    cargarIncidencias();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!showCrearModal && !incidenciaReprog) {
        cargarIncidencias(true);
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [showCrearModal, incidenciaReprog]);

  const handleCrearSubmit = async (e) => {
    e.preventDefault();
    setCrearError('');

    const hoyStr = new Date().toISOString().split('T')[0];
    if (fechaCita < hoyStr) {
      setCrearError('La fecha de la cita no puede ser anterior a hoy.');
      showToast('La fecha de la cita no puede ser anterior a hoy', 'error');
      return;
    }

    if (!/^[0-9]{9,15}$/.test(telefonoContacto)) {
      setCrearError('El teléfono de contacto debe contener entre 9 y 15 dígitos numéricos.');
      showToast('El teléfono debe tener entre 9 y 15 dígitos numéricos', 'error');
      return;
    }

    setCreando(true);

    try {
      const body = {
        tipo: nuevoTipo,
        direccion,
        telefonoContacto,
        descripcion,
        fechaCita,
        franja: nuevoTipo === 'AVERIA' ? franja : null,
        horaInicioEstimada: nuevoTipo === 'FIBRA' ? (horaInicioEstimada.length === 5 ? `${horaInicioEstimada}:00` : horaInicioEstimada) : null,
        duracionEstimadaMinutos: nuevoTipo === 'FIBRA' ? Number(duracionEstimadaMinutos) : null,
      };

      const res = await apiFetch('/incidencias', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      setShowCrearModal(false);
      setDescripcion('');
      setDireccion('');
      showToast(`Incidencia #${res.id} registrada correctamente`, 'exito');
      cargarIncidencias();
    } catch (err) {
      setCrearError(err.message || 'Error al crear la incidencia');
      showToast(err.message || 'Error al crear la incidencia', 'error');
    } finally {
      setCreando(false);
    }
  };

  const abrirModalReprogramar = (inc) => {
    setIncidenciaReprog(inc);
    setReprogFecha('');
    setReprogFranja('MANANA');
    setReprogHora('');
    setHuecosLibres([]);
    setReprogError('');
  };

  const handleCambioFechaReprog = async (nuevaFecha) => {
    setReprogFecha(nuevaFecha);
    setReprogHora('');
    setHuecosLibres([]);
    if (!nuevaFecha || incidenciaReprog.tipo !== 'FIBRA') return;

    setCargandoHuecos(true);
    try {
      const huecos = await apiFetch(`/incidencias/${incidenciaReprog.id}/huecos-libres?fecha=${nuevaFecha}`);
      setHuecosLibres(huecos);
      if (huecos.length > 0) {
        setReprogHora(huecos[0]);
      }
    } catch (err) {
      setReprogError(err.message || 'Error al consultar huecos libres');
      showToast(err.message || 'Error al consultar huecos', 'error');
    } finally {
      setCargandoHuecos(false);
    }
  };

  const handleReprogramarSubmit = async (e) => {
    e.preventDefault();
    setReprogError('');
    setReprogramando(true);

    try {
      const body = {
        fechaCita: reprogFecha,
        franja: incidenciaReprog.tipo === 'AVERIA' ? reprogFranja : null,
        horaInicioEstimada: incidenciaReprog.tipo === 'FIBRA' ? (reprogHora.length === 5 ? `${reprogHora}:00` : reprogHora) : null,
      };

      await apiFetch(`/incidencias/${incidenciaReprog.id}/reprogramar`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

      setIncidenciaReprog(null);
      showToast('Incidencia reprogramada con éxito', 'exito');
      cargarIncidencias();
    } catch (err) {
      setReprogError(err.message || 'Error al reprogramar');
      showToast(err.message || 'Error al reprogramar', 'error');
    } finally {
      setReprogramando(false);
    }
  };

  const getEstadoBadge = (estado) => {
    const estilos = {
      PENDIENTE: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
      ASIGNADA: 'bg-blue-50 text-blue-700 border-blue-200',
      EN_CURSO: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold',
      STAND_BY: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
      RESUELTA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    return (
      <span className={`px-2.5 py-0.5 text-xs rounded-full border ${estilos[estado] || 'bg-slate-100 text-slate-700'}`}>
        {estado.replace('_', ' ')}
      </span>
    );
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  const navItems = [
    {
      id: 'INCIDENCIAS',
      label: 'Mis Incidencias',
      badge: incidencias.length > 0 ? incidencias.length : null,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
  ];

  return (
    <TailAdminLayout
      title="Portal de Atención al Cliente"
      subtitle={`Bienvenido, ${user?.nombre}`}
      activeTab="INCIDENCIAS"
      onTabChange={() => {}}
      navItems={navItems}
    >
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800">
          <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* BARRA SUPERIOR CON ACCIÓN NUEVA INCIDENCIA */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Registro de Incidencias e Instalaciones</h3>
          <p className="text-xs text-slate-500">Consulta el estado de tu conexión o solicita asistencia técnica.</p>
        </div>
        <button
          onClick={() => setShowCrearModal(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition shadow-xs cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nueva Incidencia</span>
        </button>
      </div>

      {/* LISTADO DE INCIDENCIAS */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
          Cargando incidencias registradas...
        </div>
      ) : incidencias.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h4 className="text-sm font-bold text-slate-800">No tienes incidencias registradas</h4>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Si experimentas cortes de conexión o necesitas una instalación de fibra, pulsa en el botón superior.
          </p>
          <button
            onClick={() => setShowCrearModal(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition cursor-pointer shadow-xs"
          >
            Abrir Incidencia
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {incidencias.map((inc) => (
            <div
              key={inc.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition duration-150"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md uppercase tracking-wider ${
                    inc.tipo === 'AVERIA'
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-cyan-100 text-cyan-900 border border-cyan-200'
                  }`}>
                    {inc.tipo}
                  </span>
                  <span className="text-xs font-mono font-medium text-slate-400">#{inc.id}</span>
                  <h4 className="text-sm font-bold text-slate-900">{inc.direccion}</h4>
                </div>
                <div>{getEstadoBadge(inc.estado)}</div>
              </div>

              <p className="text-xs text-slate-600 mb-3">{inc.descripcion}</p>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex flex-wrap items-center gap-4">
                  <span>
                    <strong className="text-slate-700">Cita:</strong> {inc.fechaCita || 'Sin fecha'}
                  </span>
                  {inc.tipo === 'AVERIA' && inc.franja && (
                    <span>
                      <strong className="text-slate-700">Franja:</strong> {inc.franja === 'MANANA' ? 'Mañana (09:00 - 14:00)' : 'Tarde (16:00 - 20:00)'}
                    </span>
                  )}
                  {inc.tipo === 'FIBRA' && inc.horaInicioEstimada && (
                    <span>
                      <strong className="text-slate-700">Horario:</strong> {inc.horaInicioEstimada} - {inc.horaFinEstimada} ({inc.duracionEstimadaMinutos} min)
                    </span>
                  )}
                  {inc.tecnico && (
                    <span>
                      <strong className="text-slate-700">Técnico:</strong> {inc.tecnico.nombre}
                    </span>
                  )}
                </div>

                {inc.estado === 'STAND_BY' && (
                  <button
                    onClick={() => abrirModalReprogramar(inc)}
                    className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition cursor-pointer shadow-xs"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Reprogramar Cita</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CREAR INCIDENCIA */}
      {showCrearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Registrar Nueva Incidencia</h3>
                <p className="text-xs text-slate-500">Solicitud técnica u orden de instalación</p>
              </div>
              <button
                onClick={() => setShowCrearModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {crearError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                {crearError}
              </div>
            )}

            <form onSubmit={handleCrearSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Tipo de Solicitud
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNuevoTipo('AVERIA')}
                    className={`rounded-lg py-2.5 px-3 text-xs font-semibold border transition cursor-pointer ${
                      nuevoTipo === 'AVERIA'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Avería / Incidencia de Red
                  </button>
                  <button
                    type="button"
                    onClick={() => setNuevoTipo('FIBRA')}
                    className={`rounded-lg py-2.5 px-3 text-xs font-semibold border transition cursor-pointer ${
                      nuevoTipo === 'FIBRA'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Instalación de Fibra Óptica
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Dirección de la Intervención
                </label>
                <input
                  type="text"
                  required
                  placeholder="Calle, número, piso y puerta"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Teléfono de Contacto (9 a 15 dígitos)
                </label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{9,15}"
                  title="Introduce solo números, entre 9 y 15 dígitos"
                  placeholder="Ej: 612345678"
                  value={telefonoContacto}
                  onChange={(e) => setTelefonoContacto(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Descripción del Problema o Solicitud
                </label>
                <textarea
                  required
                  rows="2"
                  placeholder="Describe la avería o los detalles de la instalación..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Fecha de la Cita
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={fechaCita}
                  onChange={(e) => setFechaCita(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              {nuevoTipo === 'AVERIA' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Franja Horaria Preferida
                  </label>
                  <select
                    value={franja}
                    onChange={(e) => setFranja(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                  >
                    <option value="MANANA">Mañana (09:00 - 14:00)</option>
                    <option value="TARDE">Tarde (16:00 - 20:00)</option>
                  </select>
                </div>
              )}

              {nuevoTipo === 'FIBRA' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Hora Inicio Deseada
                    </label>
                    <input
                      type="time"
                      required
                      value={horaInicioEstimada}
                      onChange={(e) => setHoraInicioEstimada(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Duración Estimada
                    </label>
                    <select
                      value={duracionEstimadaMinutos}
                      onChange={(e) => setDuracionEstimadaMinutos(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                    >
                      <option value="60">60 minutos (1 hora)</option>
                      <option value="90">90 minutos (1.5 horas)</option>
                      <option value="120">120 minutos (2 horas)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCrearModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creando}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer shadow-xs"
                >
                  {creando ? 'Creando...' : 'Confirmar y Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REPROGRAMAR (STAND_BY) */}
      {incidenciaReprog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Reprogramar Cita Técnica</h3>
                <p className="text-xs text-slate-500">Incidencia #{incidenciaReprog.id} ({incidenciaReprog.tipo})</p>
              </div>
              <button
                onClick={() => setIncidenciaReprog(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              Tu incidencia se encuentra en estado de pausa (<strong>Stand By</strong>). Por favor, selecciona una nueva fecha futura para que el técnico acuda a tu domicilio.
            </div>

            {reprogError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                {reprogError}
              </div>
            )}

            <form onSubmit={handleReprogramarSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Nueva Fecha</label>
                <input
                  type="date"
                  required
                  min={minDateStr}
                  value={reprogFecha}
                  onChange={(e) => handleCambioFechaReprog(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              {incidenciaReprog.tipo === 'AVERIA' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Nueva Franja Horaria</label>
                  <select
                    value={reprogFranja}
                    onChange={(e) => setReprogFranja(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                  >
                    <option value="MANANA">Mañana (09:00 - 14:00)</option>
                    <option value="TARDE">Tarde (16:00 - 20:00)</option>
                  </select>
                </div>
              )}

              {incidenciaReprog.tipo === 'FIBRA' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Huecos Libres Disponibles ({incidenciaReprog.duracionEstimadaMinutos || 60} min)
                  </label>
                  {cargandoHuecos ? (
                    <div className="text-xs text-slate-400 py-2">Consultando disponibilidad en agenda...</div>
                  ) : !reprogFecha ? (
                    <div className="text-xs text-slate-400 py-2">Selecciona primero una fecha para consultar huecos.</div>
                  ) : huecosLibres.length === 0 ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
                      No hay huecos disponibles en esa fecha. Por favor, elige otro día.
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                      {huecosLibres.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setReprogHora(h)}
                          className={`rounded-lg py-1.5 px-2 text-xs font-semibold border transition cursor-pointer ${
                            reprogHora === h
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {h.slice(0, 5)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIncidenciaReprog(null)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={reprogramando || (incidenciaReprog.tipo === 'FIBRA' && !reprogHora)}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer shadow-xs"
                >
                  {reprogramando ? 'Guardando...' : 'Confirmar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </TailAdminLayout>
  );
}
