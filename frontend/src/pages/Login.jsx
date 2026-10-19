import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get('expired') === '1') {
      setInfo('Tu sesión ha caducado. Por favor, vuelve a iniciar sesión.');
    }
  }, [searchParams]);

  const redirectByRole = (rol) => {
    switch (rol) {
      case 'CLIENTE':
        navigate('/cliente');
        break;
      case 'TECNICO':
        navigate('/tecnico');
        break;
      case 'GESTOR':
        navigate('/gestor');
        break;
      default:
        navigate('/');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(email, password);
      redirectByRole(userData.rol);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail, userPassword) => {
    setEmail(userEmail);
    setPassword(userPassword);
    setError('');
    setLoading(true);

    try {
      const userData = await login(userEmail, userPassword);
      redirectByRole(userData.rol);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A222C] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 border border-slate-200">
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Telefónica"
            className="w-14 h-14 rounded-xl mx-auto mb-3 object-cover shadow-md"
          />
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Telefónica Incidencias</h1>
          <p className="text-sm text-slate-500 mt-1">Plataforma de Gestión de Fibra y Averías</p>
        </div>

        {info && (
          <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-center gap-2.5">
            <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{info}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2.5">
            <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@ejemplo.com"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3C50E0]/20 focus:border-[#3C50E0] transition text-sm text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3C50E0]/20 focus:border-[#3C50E0] transition text-sm text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-[#3C50E0] hover:bg-[#3344bd] text-white font-medium rounded-lg transition shadow-md shadow-blue-500/20 disabled:opacity-50 text-sm"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          ¿Eres un cliente nuevo?{' '}
          <Link to="/registro" className="text-[#3C50E0] font-semibold hover:underline">
            Crear una cuenta
          </Link>
        </div>

        {/* Acceso Rápido para Demostración */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
            Acceso Rápido Cuentas Oficiales
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('gestor@telecom.es', 'gestor123')}
              className="py-2 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Gestor
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('tecnico1@telecom.es', 'tecnico123')}
              className="py-2 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Técnico 1
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('tecnico2@telecom.es', 'tecnico123')}
              className="py-2 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.393 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
              Técnico 2
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

