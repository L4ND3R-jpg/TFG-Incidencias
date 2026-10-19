import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../services/api';
import { TailAdminLayout } from '../components/layout/TailAdminLayout';
import { CardDataStats } from '../components/common/CardDataStats';

function getIsoWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getIsoYear(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

export function GestorDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [tabActiva, setTabActiva] = useState('INCIDENCIAS');

  // Estados de datos
  const [incidencias, setIncidencias] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [partes, setPartes] = useState([]);

  // Carga y errores
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filtros de incidencias
  const [filtroEstado, setFiltroEstado] = useState('TODAS');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');

  // Filtros de turnos
  const [anioTurnos, setAnioTurnos] = useState(getIsoYear());
  const [semanaTurnos, setSemanaTurnos] = useState(getIsoWeek());

  // Modal Reasignar
  const [incidenciaAReasignar, setIncidenciaAReasignar] = useState(null);
  const [nuevoTecnicoId, setNuevoTecnicoId] = useState('');
  const [guardandoReasig, setGuardandoReasig] = useState(false);

  // Modal Turno
  const [modalTurnoAbierto, setModalTurnoAbierto] = useState(false);
  const [formTurno, setFormTurno] = useState({
    tecnicoId: '',
    anio: getIsoYear(),
    semana: getIsoWeek(),
    tipoAsignado: 'AVERIAS',
  });
  const [guardandoTurno, setGuardandoTurno] = useState(false);

  // Formulario Alta Técnico
  const [formTecnico, setFormTecnico] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
  });
  const [guardandoTecnico, setGuardandoTecnico] = useState(false);

  // Modal Ver Parte
  const [parteVisualizado, setParteVisualizado] = useState(null);

  const cargarTecnicos = async () => {
    try {
      const data = await apiFetch('/asignaciones-semanales/tecnicos');
      setTecnicos(data || []);
      if (data && data.length > 0 && !formTurno.tecnicoId) {
        setFormTurno((prev) => ({ ...prev, tecnicoId: data[0].id }));
      }
    } catch {
      // Silencioso
    }
  };

  const cargarIncidencias = async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      setError('');
      const data = await apiFetch('/incidencias');
      setIncidencias(data || []);
    } catch (err) {
      if (!silencioso) setError(err.message || 'Error al cargar incidencias');
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  const cargarTurnos = async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      setError('');
      const data = await apiFetch(
        `/asignaciones-semanales?anio=${anioTurnos}&semana=${semanaTurnos}`
      );
      setAsignaciones(data || []);
    } catch (err) {
      if (!silencioso) setError(err.message || 'Error al cargar asignaciones semanales');
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  const cargarPartes = async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      setError('');
      const data = await apiFetch('/partes');
      setPartes(data || []);
    } catch (err) {
      if (!silencioso) setError(err.message || 'Error al cargar partes de trabajo');
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  useEffect(() => {
    cargarTecnicos();
  }, []);

  useEffect(() => {
    if (tabActiva === 'INCIDENCIAS') {
      cargarIncidencias();
    } else if (tabActiva === 'TURNOS') {
      cargarTurnos();
    } else if (tabActiva === 'PARTES') {
      cargarPartes();
    }
  }, [tabActiva, anioTurnos, semanaTurnos]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!incidenciaAReasignar && !modalTurnoAbierto && !parteVisualizado) {
        if (tabActiva === 'INCIDENCIAS') {
          cargarIncidencias(true);
        } else if (tabActiva === 'TURNOS') {
          cargarTurnos(true);
        } else if (tabActiva === 'PARTES') {
          cargarPartes(true);
        }
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [tabActiva, incidenciaAReasignar, modalTurnoAbierto, parteVisualizado, anioTurnos, semanaTurnos]);

  const handleReasignar = async (e) => {
    e.preventDefault();
    if (!nuevoTecnicoId) {
      showToast('Por favor selecciona un técnico', 'error');
      return;
    }

    try {
      setGuardandoReasig(true);
      await apiFetch(`/incidencias/${incidenciaAReasignar.id}/reasignar`, {
        method: 'PATCH',
        body: JSON.stringify({ tecnicoId: Number(nuevoTecnicoId) }),
      });
      showToast('Incidencia asignada correctamente', 'exito');
      setIncidenciaAReasignar(null);
      setNuevoTecnicoId('');
      cargarIncidencias();
    } catch (err) {
      showToast(err.message || 'Error al reasignar incidencia', 'error');
    } finally {
      setGuardandoReasig(false);
    }
  };

  const handleGuardarTurno = async (e) => {
    e.preventDefault();
    try {
      setGuardandoTurno(true);
      await apiFetch('/asignaciones-semanales', {
        method: 'POST',
        body: JSON.stringify({
          tecnicoId: Number(formTurno.tecnicoId),
          anio: Number(formTurno.anio),
          semana: Number(formTurno.semana),
          tipoAsignado: formTurno.tipoAsignado,
        }),
      });
      showToast('Turno semanal guardado correctamente', 'exito');
      setModalTurnoAbierto(false);
      cargarTurnos();
    } catch (err) {
      showToast(err.message || 'Error al guardar asignación', 'error');
    } finally {
      setGuardandoTurno(false);
    }
  };

  const handleCrearTecnico = async (e) => {
    e.preventDefault();
    if (!/^[0-9]{9,15}$/.test(formTecnico.telefono)) {
      showToast('El teléfono debe tener entre 9 y 15 dígitos numéricos', 'error');
      return;
    }

    try {
      setGuardandoTecnico(true);
      await apiFetch('/usuarios/tecnicos', {
        method: 'POST',
        body: JSON.stringify(formTecnico),
      });
      showToast(`Técnico "${formTecnico.nombre}" dado de alta con éxito`, 'exito');
      setFormTecnico({ nombre: '', email: '', telefono: '', password: '' });
      cargarTecnicos();
      setTabActiva('TURNOS');
    } catch (err) {
      showToast(err.message || 'Error al dar de alta el técnico', 'error');
    } finally {
      setGuardandoTecnico(false);
    }
  };

  const verParteDeIncidencia = async (incId) => {
    try {
      const parte = await apiFetch(`/incidencias/${incId}/parte`);
      setParteVisualizado(parte);
    } catch (err) {
      showToast(err.message || 'No se pudo obtener el parte de la incidencia', 'error');
    }
  };

  const contadores = {
    PENDIENTE: incidencias.filter((i) => i.estado === 'PENDIENTE').length,
    ASIGNADA: incidencias.filter((i) => i.estado === 'ASIGNADA').length,
    EN_CURSO: incidencias.filter((i) => i.estado === 'EN_CURSO').length,
    STAND_BY: incidencias.filter((i) => i.estado === 'STAND_BY').length,
    RESUELTA: incidencias.filter((i) => i.estado === 'RESUELTA').length,
  };

  const prioridadEstado = {
    PENDIENTE: 1,
    STAND_BY: 2,
    EN_CURSO: 3,
    ASIGNADA: 4,
    RESUELTA: 5,
  };

  const incidenciasFiltradas = incidencias
    .filter((inc) => {
      const cumpleEstado = filtroEstado === 'TODAS' || inc.estado === filtroEstado;
      const cumpleTipo = filtroTipo === 'TODOS' || inc.tipo === filtroTipo;
      return cumpleEstado && cumpleTipo;
    })
    .sort((a, b) => {
      const pA = prioridadEstado[a.estado] || 99;
      const pB = prioridadEstado[b.estado] || 99;
      if (pA !== pB) return pA - pB;
      return b.id - a.id;
    });

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

  const navItems = [
    {
      id: 'INCIDENCIAS',
      label: 'Incidencias',
      badge: incidencias.length > 0 ? incidencias.length : null,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      id: 'TURNOS',
      label: 'Turnos y Asignación',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'PARTES',
      label: 'Partes de Trabajo',
      badge: partes.length > 0 ? partes.length : null,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'ALTA_TECNICO',
      label: 'Alta de Técnicos',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    },
  ];

  return (
    <TailAdminLayout
      title="Centro de Operaciones y Gestión"
      subtitle={`Panel de control corporativo • ${user?.nombre}`}
      activeTab={tabActiva}
      onTabChange={setTabActiva}
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

      {/* ========================================================= */}
      {/* PESTAÑA 1: INCIDENCIAS */}
      {/* ========================================================= */}
      {tabActiva === 'INCIDENCIAS' && (
        <div className="space-y-6">
          {/* TARJETAS DE ESTADÍSTICAS TAILADMIN */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <CardDataStats
              title="Pendientes"
              total={contadores.PENDIENTE}
              subtitle="Sin asignar"
              isActive={filtroEstado === 'PENDIENTE'}
              onClick={() => setFiltroEstado(filtroEstado === 'PENDIENTE' ? 'TODAS' : 'PENDIENTE')}
            >
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </CardDataStats>

            <CardDataStats
              title="Stand By"
              total={contadores.STAND_BY}
              subtitle="En espera"
              isActive={filtroEstado === 'STAND_BY'}
              onClick={() => setFiltroEstado(filtroEstado === 'STAND_BY' ? 'TODAS' : 'STAND_BY')}
            >
              <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </CardDataStats>

            <CardDataStats
              title="En Curso"
              total={contadores.EN_CURSO}
              subtitle="En campo"
              isActive={filtroEstado === 'EN_CURSO'}
              onClick={() => setFiltroEstado(filtroEstado === 'EN_CURSO' ? 'TODAS' : 'EN_CURSO')}
            >
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </CardDataStats>

            <CardDataStats
              title="Asignadas"
              total={contadores.ASIGNADA}
              subtitle="Programadas"
              isActive={filtroEstado === 'ASIGNADA'}
              onClick={() => setFiltroEstado(filtroEstado === 'ASIGNADA' ? 'TODAS' : 'ASIGNADA')}
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </CardDataStats>

            <CardDataStats
              title="Resueltas"
              total={contadores.RESUELTA}
              subtitle="Completadas"
              isActive={filtroEstado === 'RESUELTA'}
              onClick={() => setFiltroEstado(filtroEstado === 'RESUELTA' ? 'TODAS' : 'RESUELTA')}
            >
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </CardDataStats>
          </div>

          {/* BARRA DE FILTROS */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado:</span>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-indigo-600 focus:bg-white"
                >
                  <option value="TODAS">Todos ({incidencias.length})</option>
                  <option value="PENDIENTE">Pendientes ({contadores.PENDIENTE})</option>
                  <option value="STAND_BY">Stand By ({contadores.STAND_BY})</option>
                  <option value="EN_CURSO">En Curso ({contadores.EN_CURSO})</option>
                  <option value="ASIGNADA">Asignadas ({contadores.ASIGNADA})</option>
                  <option value="RESUELTA">Resueltas ({contadores.RESUELTA})</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo:</span>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-indigo-600 focus:bg-white"
                >
                  <option value="TODOS">Todos los tipos</option>
                  <option value="AVERIA">Avería</option>
                  <option value="FIBRA">Instalación Fibra</option>
                </select>
              </div>

              {filtroEstado !== 'TODAS' && (
                <button
                  onClick={() => setFiltroEstado('TODAS')}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                >
                  Restablecer filtro
                </button>
              )}
            </div>

            <button
              onClick={() => cargarIncidencias()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Actualizar</span>
            </button>
          </div>

          {/* LISTA DE INCIDENCIAS */}
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
              Cargando registros...
            </div>
          ) : incidenciasFiltradas.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-800">No hay incidencias que mostrar</h3>
              <p className="text-xs text-slate-400 mt-1">No se encontraron registros con los filtros actuales.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incidenciasFiltradas.map((inc) => {
                const esPendiente = inc.estado === 'PENDIENTE';
                const esStandBy = inc.estado === 'STAND_BY';

                return (
                  <div
                    key={inc.id}
                    className={`rounded-xl border p-5 transition duration-150 ${
                      esPendiente
                        ? 'border-amber-300 bg-amber-50/40 shadow-xs'
                        : esStandBy
                        ? 'border-rose-200 bg-rose-50/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                    }`}
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
                        {esPendiente && (
                          <span className="rounded-md bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                            Sin técnico asignado
                          </span>
                        )}
                      </div>
                      <div>{getEstadoBadge(inc.estado)}</div>
                    </div>

                    <div className="grid gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3.5 text-xs text-slate-600 md:grid-cols-2">
                      <div>
                        <p><strong className="text-slate-800">Descripción:</strong> {inc.descripcion}</p>
                        <p className="mt-1.5">
                          <strong className="text-slate-800">Cliente:</strong> {inc.cliente?.nombre} ({inc.cliente?.email})
                        </p>
                        <p className="mt-1.5">
                          <strong className="text-slate-800">Teléfono:</strong>{' '}
                          <a href={`tel:${inc.telefonoContacto}`} className="text-indigo-600 font-semibold hover:underline">
                            {inc.telefonoContacto}
                          </a>
                        </p>
                      </div>
                      <div>
                        <p>
                          <strong className="text-slate-800">Fecha Cita:</strong> {inc.fechaCita}
                          {inc.tipo === 'AVERIA' && inc.franja && ` (${inc.franja})`}
                          {inc.tipo === 'FIBRA' && inc.horaInicioEstimada && ` (${inc.horaInicioEstimada} - ${inc.horaFinEstimada})`}
                        </p>
                        <p className="mt-1.5">
                          <strong className="text-slate-800">Técnico Asignado:</strong>{' '}
                          {inc.tecnico ? (
                            <span className="font-semibold text-slate-900">{inc.tecnico.nombre} ({inc.tecnico.email})</span>
                          ) : (
                            <span className="text-amber-700 font-semibold italic">Pendiente de asignación</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-100">
                      {inc.estado !== 'RESUELTA' && (
                        <button
                          onClick={() => {
                            setIncidenciaAReasignar(inc);
                            setNuevoTecnicoId(inc.tecnico?.id || (tecnicos[0]?.id || ''));
                          }}
                          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                            esPendiente
                              ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-xs'
                              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {esPendiente ? 'Asignar Técnico' : 'Reasignar Técnico'}
                        </button>
                      )}

                      {inc.estado === 'RESUELTA' && (
                        <button
                          onClick={() => verParteDeIncidencia(inc.id)}
                          className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        >
                          Ver Parte de Trabajo
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 2: TURNOS Y ASIGNACIÓN SEMANAL */}
      {/* ========================================================= */}
      {tabActiva === 'TURNOS' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Año:</span>
                <input
                  type="number"
                  min="2024"
                  max="2035"
                  value={anioTurnos}
                  onChange={(e) => setAnioTurnos(Number(e.target.value))}
                  className="w-20 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Semana:</span>
                <input
                  type="number"
                  min="1"
                  max="53"
                  value={semanaTurnos}
                  onChange={(e) => setSemanaTurnos(Number(e.target.value))}
                  className="w-16 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
              <button
                onClick={() => {
                  setAnioTurnos(getIsoYear());
                  setSemanaTurnos(getIsoWeek());
                }}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Semana Actual
              </button>
            </div>

            <button
              onClick={() => {
                setFormTurno({
                  tecnicoId: tecnicos[0]?.id || '',
                  anio: anioTurnos,
                  semana: semanaTurnos,
                  tipoAsignado: 'AVERIAS',
                });
                setModalTurnoAbierto(true);
              }}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition shadow-xs cursor-pointer"
            >
              Asignar / Cambiar Turno
            </button>
          </div>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
              Cargando turnos de la semana...
            </div>
          ) : asignaciones.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
              <h4 className="text-sm font-bold text-slate-800">
                Sin asignaciones registradas
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                No hay turnos registrados para la semana {semanaTurnos} del año {anioTurnos}.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {asignaciones.map((asig) => (
                <div
                  key={asig.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                        asig.tipoAsignado === 'AVERIAS'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-cyan-100 text-cyan-900 border border-cyan-200'
                      }`}>
                        {asig.tipoAsignado}
                      </span>
                      <span className="text-xs text-slate-400">Semana {asig.semana} / {asig.anio}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{asig.tecnico?.nombre}</h4>
                    <p className="text-xs text-slate-500">{asig.tecnico?.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setFormTurno({
                        tecnicoId: asig.tecnico?.id,
                        anio: asig.anio,
                        semana: asig.semana,
                        tipoAsignado: asig.tipoAsignado === 'AVERIAS' ? 'FIBRA' : 'AVERIAS',
                      });
                      setModalTurnoAbierto(true);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Rotar Turno
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 3: PARTES DE TRABAJO */}
      {/* ========================================================= */}
      {tabActiva === 'PARTES' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Histórico de Partes de Trabajo</h3>
              <p className="text-xs text-slate-500">Intervenciones finalizadas y cobros por material adicional.</p>
            </div>
            <button
              onClick={() => cargarPartes()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Actualizar</span>
            </button>
          </div>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
              Cargando partes...
            </div>
          ) : partes.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
              <h4 className="text-sm font-bold text-slate-800">No hay partes de trabajo registrados</h4>
              <p className="text-xs text-slate-500 mt-1">Los partes se registran cuando un técnico resuelve una intervención.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">ID Parte</th>
                      <th className="px-5 py-3.5">Incidencia</th>
                      <th className="px-5 py-3.5">Fecha</th>
                      <th className="px-5 py-3.5">Técnico</th>
                      <th className="px-5 py-3.5">Horario Real</th>
                      <th className="px-5 py-3.5">Total Extras</th>
                      <th className="px-5 py-3.5 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {partes.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-900">#{p.id}</td>
                        <td className="px-5 py-3.5 font-medium text-slate-700">Incidencia #{p.incidenciaId}</td>
                        <td className="px-5 py-3.5">{p.fecha}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">{p.tecnico?.nombre}</td>
                        <td className="px-5 py-3.5">{p.horaInicioReal} - {p.horaFinReal}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          {p.totalExtras > 0 ? `${Number(p.totalExtras).toFixed(2)} €` : '0.00 €'}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => setParteVisualizado(p)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                          >
                            Ver Detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 4: ALTA DE TÉCNICOS */}
      {/* ========================================================= */}
      {tabActiva === 'ALTA_TECNICO' && (
        <div className="max-w-2xl mx-auto">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Alta de Nuevo Técnico de Campo</h3>
              <p className="text-xs text-slate-500 mt-1">
                Registra un técnico oficial para la red. Se le asignará el rol <span className="font-semibold text-slate-700">TECNICO</span> y estará disponible inmediatamente para rotaciones e intervenciones.
              </p>
            </div>

            <form onSubmit={handleCrearTecnico} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Martínez Ruiz"
                  value={formTecnico.nombre}
                  onChange={(e) => setFormTecnico({ ...formTecnico, nombre: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Correo Electrónico Corporativo
                </label>
                <input
                  type="email"
                  required
                  placeholder="tecnico@telecom.es"
                  value={formTecnico.email}
                  onChange={(e) => setFormTecnico({ ...formTecnico, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Teléfono Móvil (9 a 15 dígitos)
                </label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{9,15}"
                  placeholder="Ej. 622334455"
                  value={formTecnico.telefono}
                  onChange={(e) => setFormTecnico({ ...formTecnico, telefono: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Contraseña Inicial (mínimo 6 caracteres)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={formTecnico.password}
                  onChange={(e) => setFormTecnico({ ...formTecnico, password: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={guardandoTecnico}
                  className="rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {guardandoTecnico ? 'Guardando...' : 'Crear Técnico'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL REASIGNAR TÉCNICO */}
      {/* ========================================================= */}
      {incidenciaAReasignar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Asignar / Reasignar Incidencia</h3>
                <p className="text-xs text-slate-500">Incidencia #{incidenciaAReasignar.id} ({incidenciaAReasignar.tipo})</p>
              </div>
              <button
                onClick={() => setIncidenciaAReasignar(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleReasignar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Seleccionar Técnico
                </label>
                <select
                  required
                  value={nuevoTecnicoId}
                  onChange={(e) => setNuevoTecnicoId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                >
                  <option value="">-- Elige un técnico disponible --</option>
                  {tecnicos.map((tec) => (
                    <option key={tec.id} value={tec.id}>
                      {tec.nombre} ({tec.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIncidenciaAReasignar(null)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoReasig}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {guardandoReasig ? 'Guardando...' : 'Confirmar Asignación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL ASIGNAR TURNO SEMANAL */}
      {/* ========================================================= */}
      {modalTurnoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Configuración de Turno Semanal</h3>
                <p className="text-xs text-slate-500">Rotación de especialidad técnica</p>
              </div>
              <button
                onClick={() => setModalTurnoAbierto(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleGuardarTurno} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Técnico
                </label>
                <select
                  required
                  value={formTurno.tecnicoId}
                  onChange={(e) => setFormTurno({ ...formTurno, tecnicoId: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                >
                  {tecnicos.map((tec) => (
                    <option key={tec.id} value={tec.id}>
                      {tec.nombre} ({tec.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Año
                  </label>
                  <input
                    type="number"
                    min="2024"
                    max="2035"
                    required
                    value={formTurno.anio}
                    onChange={(e) => setFormTurno({ ...formTurno, anio: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Semana ISO (1-53)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="53"
                    required
                    value={formTurno.semana}
                    onChange={(e) => setFormTurno({ ...formTurno, semana: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Especialidad
                </label>
                <select
                  value={formTurno.tipoAsignado}
                  onChange={(e) => setFormTurno({ ...formTurno, tipoAsignado: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                >
                  <option value="AVERIAS">AVERIAS (Averías y Cortes)</option>
                  <option value="FIBRA">FIBRA (Instalaciones)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalTurnoAbierto(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoTurno}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {guardandoTurno ? 'Guardando...' : 'Guardar Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL VER DETALLE DE PARTE */}
      {/* ========================================================= */}
      {parteVisualizado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Parte de Trabajo #{parteVisualizado.id}</h3>
                <p className="text-xs text-slate-500">Asociado a Incidencia #{parteVisualizado.incidenciaId}</p>
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
              <p><strong className="text-slate-900">Fecha intervención:</strong> {parteVisualizado.fecha}</p>
              <p><strong className="text-slate-900">Horario real:</strong> {parteVisualizado.horaInicioReal} - {parteVisualizado.horaFinReal}</p>
              <p><strong className="text-slate-900">Técnico:</strong> {parteVisualizado.tecnico?.nombre} ({parteVisualizado.tecnico?.email})</p>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="font-bold text-slate-800 mb-1">Trabajo realizado:</p>
                <p className="text-slate-600">{parteVisualizado.descripcionRealizado}</p>
              </div>

              {parteVisualizado.extras && parteVisualizado.extras.length > 0 && (
                <div>
                  <p className="font-bold text-slate-800 mb-1.5 uppercase tracking-wider text-[11px]">Material Adicional Cobrable</p>
                  <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                    {parteVisualizado.extras.map((ex, i) => (
                      <li key={i} className="py-1 flex justify-between">
                        <span>{ex.concepto}</span>
                        <span className="font-semibold text-slate-900">{Number(ex.importe).toFixed(2)} €</span>
                      </li>
                    ))}
                    <li className="pt-2 flex justify-between font-bold text-indigo-700 border-t border-slate-200">
                      <span>Total Extras</span>
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
