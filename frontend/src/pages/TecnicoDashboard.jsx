import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../services/api';
import { TailAdminLayout } from '../components/layout/TailAdminLayout';

export function TecnicoDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroVista, setFiltroVista] = useState('TODAS'); // 'TODAS' o 'HOY'

  // Modal para Parte de Trabajo
  const [incidenciaParte, setIncidenciaParte] = useState(null);
  const [fechaParte, setFechaParte] = useState(new Date().toISOString().split('T')[0]);
  const [horaInicioReal, setHoraInicioReal] = useState('09:00');
  const [horaFinReal, setHoraFinReal] = useState('10:30');
  const [descripcionRealizado, setDescripcionRealizado] = useState('');
  const [extras, setExtras] = useState([]);
  const [guardandoParte, setGuardandoParte] = useState(false);
  const [parteError, setParteError] = useState('');

  // Modal para Ver Parte existente
  const [parteVisualizado, setParteVisualizado] = useState(null);
  const [cargandoParteVis, setCargandoParteVis] = useState(false);

  // Intervalo local para decrementar el contador regresivo de "Avisar Cliente"
  useEffect(() => {
    const timer = setInterval(() => {
      setIncidencias((prev) =>
        prev.map((inc) => {
          if (inc.segundosRestantesAviso && inc.segundosRestantesAviso > 0) {
            const restantes = inc.segundosRestantesAviso - 1;
            return {
              ...inc,
              segundosRestantesAviso: restantes,
              puedeAvisar: restantes === 0,
            };
          }
          return inc;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const cargarIncidencias = async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      setError('');
      let endpoint = `/incidencias/tecnico/agenda-diaria?fecha=${fechaSeleccionada}`;
      if (filtroVista === 'TODAS') {
        endpoint = '/incidencias';
      }
      const data = await apiFetch(endpoint);

      setIncidencias((prev) => {
        const countdownMap = {};
        prev.forEach((i) => {
          if (i.segundosRestantesAviso !== undefined) {
            countdownMap[i.id] = {
              segundos: i.segundosRestantesAviso,
              puedeAvisar: i.puedeAvisar,
            };
          }
        });

        return (data || []).map((inc) => {
          if (countdownMap[inc.id] && countdownMap[inc.id].segundos > 0) {
            return {
              ...inc,
              segundosRestantesAviso: countdownMap[inc.id].segundos,
              puedeAvisar: false,
            };
          }
          return inc;
        });
      });
    } catch (err) {
      if (!silencioso) setError(err.message || 'Error al cargar las incidencias');
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  useEffect(() => {
    cargarIncidencias();
  }, [fechaSeleccionada, filtroVista]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!incidenciaParte && !parteVisualizado) {
        cargarIncidencias(true);
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [fechaSeleccionada, filtroVista, incidenciaParte, parteVisualizado]);

  const handleEmpezar = async (id) => {
    try {
      await apiFetch(`/incidencias/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ nuevoEstado: 'EN_CURSO' }),
      });
      showToast('Intervención iniciada (En curso)', 'exito');
      cargarIncidencias();
    } catch (err) {
      showToast(err.message || 'Error al iniciar la incidencia', 'error');
    }
  };

  const handleStandBy = async (id) => {
    if (!window.confirm('¿Confirmas pasar la incidencia a STAND BY? El cliente y el gestor serán notificados.')) {
      return;
    }
    try {
      await apiFetch(`/incidencias/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ nuevoEstado: 'STAND_BY' }),
      });
      showToast('Incidencia en Stand By', 'exito');
      cargarIncidencias();
    } catch (err) {
      showToast(err.message || 'Error al pasar a Stand By', 'error');
    }
  };

  const handleAvisarCliente = async (id) => {
    try {
      const dataActualizada = await apiFetch(`/incidencias/${id}/avisar-cliente`, {
        method: 'POST',
      });
      showToast('Aviso enviado al cliente. Cooldown de 5 minutos activo.', 'exito');
      setIncidencias((prev) =>
        prev.map((inc) => (inc.id === id ? dataActualizada : inc))
      );
    } catch (err) {
      showToast(err.message || 'Error al avisar al cliente', 'error');
    }
  };

  const abrirModalParte = (inc) => {
    setIncidenciaParte(inc);
    setFechaParte(new Date().toISOString().split('T')[0]);
    setHoraInicioReal('09:00');
    setHoraFinReal('10:30');
    setDescripcionRealizado('');
    setExtras([]);
    setParteError('');
  };

  const agregarExtra = () => {
    setExtras([...extras, { concepto: '', importe: '' }]);
  };

  const modificarExtra = (index, campo, valor) => {
    const nuevos = [...extras];
    nuevos[index][campo] = valor;
    setExtras(nuevos);
  };

  const eliminarExtra = (index) => {
    setExtras(extras.filter((_, i) => i !== index));
  };

  const calcularTotalExtras = () => {
    return extras
      .reduce((acc, curr) => acc + (parseFloat(curr.importe) || 0), 0)
      .toFixed(2);
  };

  const handleGuardarParte = async (e) => {
    e.preventDefault();
    setParteError('');
    setGuardandoParte(true);

    try {
      const body = {
        fecha: fechaParte,
        horaInicioReal: horaInicioReal.length === 5 ? `${horaInicioReal}:00` : horaInicioReal,
        horaFinReal: horaFinReal.length === 5 ? `${horaFinReal}:00` : horaFinReal,
        descripcionRealizado,
        extras: extras.map((ex) => ({
          concepto: ex.concepto,
          importe: parseFloat(ex.importe),
        })),
      };

      await apiFetch(`/incidencias/${incidenciaParte.id}/parte`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      showToast('Parte de trabajo emitido. Incidencia RESUELTA.', 'exito');
      setIncidenciaParte(null);
      cargarIncidencias();
    } catch (err) {
      setParteError(err.message || 'Error al guardar el parte de trabajo');
      showToast(err.message || 'Error al guardar el parte', 'error');
    } finally {
      setGuardandoParte(false);
    }
  };

  const verParteDeIncidencia = async (incId) => {
    setCargandoParteVis(true);
    try {
      const parte = await apiFetch(`/incidencias/${incId}/parte`);
      setParteVisualizado(parte);
    } catch (err) {
      showToast(err.message || 'No se pudo cargar el parte', 'error');
    } finally {
      setCargandoParteVis(false);
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

  const formatearTiempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const navItems = [
    {
      id: 'TODAS',
      label: 'Todas Mis Asignadas',
      badge: incidencias.length > 0 ? incidencias.length : null,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      id: 'HOY',
      label: 'Agenda del Día',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <TailAdminLayout
      title="Operaciones de Campo"
      subtitle={`Panel de Técnico • ${user?.nombre}`}
      activeTab={filtroVista}
      onTabChange={setFiltroVista}
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

      {/* BARRA DE VISTA / SELECTOR DE FECHA */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Modo de Vista:</span>
          <div className="flex rounded-lg bg-slate-100 p-0.5">
            <button
              onClick={() => setFiltroVista('TODAS')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                filtroVista === 'TODAS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas Asignadas
            </button>
            <button
              onClick={() => setFiltroVista('HOY')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                filtroVista === 'HOY'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Agenda Diaria
            </button>
          </div>
        </div>

        {filtroVista === 'HOY' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha:</span>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
            />
            <button
              onClick={() => setFechaSeleccionada(new Date().toISOString().split('T')[0])}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Hoy
            </button>
          </div>
        )}
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            {filtroVista === 'HOY' ? `Intervenciones programadas para el ${fechaSeleccionada}` : 'Todas tus intervenciones activas'}
          </h3>
          <span className="text-xs font-semibold text-slate-500">{incidencias.length} registros</span>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
            Cargando agenda de trabajo...
          </div>
        ) : incidencias.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              {filtroVista === 'HOY' ? 'Sin intervenciones para esta fecha' : 'No tienes intervenciones asignadas'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 mb-3">
              {filtroVista === 'HOY'
                ? `No tienes citas de trabajo programadas para el ${fechaSeleccionada}.`
                : 'En este momento no tienes intervenciones pendientes ni en curso.'}
            </p>
            {filtroVista === 'HOY' && (
              <button
                onClick={() => setFiltroVista('TODAS')}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Ver todas mis asignadas
              </button>
            )}
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

                <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5 text-xs text-slate-600 mb-3 space-y-1">
                  <p><strong className="text-slate-800">Descripción:</strong> {inc.descripcion}</p>
                  <p>
                    <strong className="text-slate-800">Cliente:</strong> {inc.cliente?.nombre} | Teléfono:{' '}
                    <a href={`tel:${inc.telefonoContacto}`} className="text-indigo-600 font-semibold hover:underline">
                      {inc.telefonoContacto}
                    </a>
                  </p>
                  <p>
                    <strong className="text-slate-800">Fecha Cita:</strong> {inc.fechaCita}
                    {inc.tipo === 'AVERIA' && inc.franja && ` (${inc.franja === 'MANANA' ? 'Mañana 09:00 - 14:00' : 'Tarde 16:00 - 20:00'})`}
                    {inc.tipo === 'FIBRA' && inc.horaInicioEstimada && ` (${inc.horaInicioEstimada} - ${inc.horaFinEstimada}, ${inc.duracionEstimadaMinutos} min)`}
                  </p>
                </div>

                {/* BOTONERA PROFESIONAL DEL TÉCNICO */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Botón Empezar */}
                    {(inc.estado === 'ASIGNADA' || inc.estado === 'STAND_BY') && (
                      <button
                        onClick={() => handleEmpezar(inc.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition cursor-pointer shadow-xs"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        </svg>
                        <span>Iniciar Intervención</span>
                      </button>
                    )}

                    {/* Botón Avisar Cliente */}
                    {(inc.estado === 'ASIGNADA' || inc.estado === 'EN_CURSO') && (
                      <button
                        onClick={() => handleAvisarCliente(inc.id)}
                        disabled={!inc.puedeAvisar}
                        className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold border transition ${
                          inc.puedeAvisar
                            ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 cursor-pointer'
                            : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span>Avisar Cliente</span>
                        {!inc.puedeAvisar && inc.segundosRestantesAviso > 0 && (
                          <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded text-[11px] text-slate-700 ml-1">
                            {formatearTiempo(inc.segundosRestantesAviso)}
                          </span>
                        )}
                      </button>
                    )}

                    {/* Botón Stand By */}
                    {(inc.estado === 'ASIGNADA' || inc.estado === 'EN_CURSO') && (
                      <button
                        onClick={() => handleStandBy(inc.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Pausar (Stand By)</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Botón Cerrar con Parte */}
                    {inc.estado === 'EN_CURSO' && (
                      <button
                        onClick={() => abrirModalParte(inc)}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Emitir Parte de Trabajo</span>
                      </button>
                    )}

                    {/* Ver Parte si ya está RESUELTA */}
                    {inc.estado === 'RESUELTA' && (
                      <button
                        onClick={() => verParteDeIncidencia(inc.id)}
                        className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                      >
                        Ver Parte
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL CERRAR CON PARTE DE TRABAJO */}
      {incidenciaParte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Emitir Parte de Trabajo</h3>
                <p className="text-xs text-slate-500">Incidencia #{incidenciaParte.id} • {incidenciaParte.direccion}</p>
              </div>
              <button
                onClick={() => setIncidenciaParte(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {parteError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                {parteError}
              </div>
            )}

            <form onSubmit={handleGuardarParte} className="space-y-4">
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">Fecha</label>
                  <input
                    type="date"
                    required
                    value={fechaParte}
                    onChange={(e) => setFechaParte(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">Hora Inicio</label>
                  <input
                    type="time"
                    required
                    value={horaInicioReal}
                    onChange={(e) => setHoraInicioReal(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">Hora Fin</label>
                  <input
                    type="time"
                    required
                    value={horaFinReal}
                    onChange={(e) => setHoraFinReal(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">Descripción de las Actuaciones</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Detalla las actuaciones técnicas, mediciones ópticas o cambios de equipo realizados..."
                  value={descripcionRealizado}
                  onChange={(e) => setDescripcionRealizado(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              {/* Extras Cobrables Dinámicos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Material Adicional Cobrable</label>
                  <button
                    type="button"
                    onClick={agregarExtra}
                    className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 cursor-pointer"
                  >
                    + Añadir concepto
                  </button>
                </div>

                {extras.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No se ha añadido material adicional facturable.</p>
                ) : (
                  <div className="space-y-2">
                    {extras.map((ex, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Concepto (ej. Cable UTP Cat 6)"
                          value={ex.concepto}
                          onChange={(e) => modificarExtra(idx, 'concepto', e.target.value)}
                          className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          placeholder="Importe €"
                          value={ex.importe}
                          onChange={(e) => modificarExtra(idx, 'importe', e.target.value)}
                          className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => eliminarExtra(idx)}
                          className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}

                    <div className="text-right text-xs font-bold text-slate-700 pt-1">
                      Total Material: <span className="text-indigo-600">{calcularTotalExtras()} €</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIncidenciaParte(null)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoParte}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer shadow-xs"
                >
                  {guardandoParte ? 'Guardando...' : 'Finalizar y Resolver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VER PARTE DE TRABAJO */}
      {parteVisualizado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Parte de Trabajo #{parteVisualizado.id}</h3>
                <p className="text-xs text-slate-500">Técnico: {parteVisualizado.tecnico?.nombre}</p>
              </div>
              <button
                onClick={() => setParteVisualizado(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <p><strong className="text-slate-900">Fecha de intervención:</strong> {parteVisualizado.fecha}</p>
              <p><strong className="text-slate-900">Horario real:</strong> {parteVisualizado.horaInicioReal} - {parteVisualizado.horaFinReal}</p>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="font-bold text-slate-800 mb-1">Trabajo realizado:</p>
                <p className="text-slate-600">{parteVisualizado.descripcionRealizado}</p>
              </div>

              {parteVisualizado.extras && parteVisualizado.extras.length > 0 && (
                <div>
                  <p className="font-bold text-slate-800 mb-1.5 uppercase tracking-wider text-[11px]">Material Adicional</p>
                  <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                    {parteVisualizado.extras.map((ex, i) => (
                      <li key={i} className="py-1 flex justify-between">
                        <span>{ex.concepto}</span>
                        <span className="font-semibold text-slate-900">{Number(ex.importe).toFixed(2)} €</span>
                      </li>
                    ))}
                    <li className="pt-2 flex justify-between font-bold text-indigo-700 border-t border-slate-200">
                      <span>Total Material</span>
                      <span>{Number(parteVisualizado.totalExtras).toFixed(2)} €</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-5 text-right border-t border-slate-100 pt-3">
              <button
                onClick={() => setParteVisualizado(null)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </TailAdminLayout>
  );
}
