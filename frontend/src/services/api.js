const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Cliente HTTP centralizado que gestiona automáticamente los tokens JWT y cabeceras.
 */
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    if (response.status === 401 && endpoint !== '/auth/login') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=1';
      }
    }

    let errorData = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { mensaje: response.statusText };
    }
    const message = errorData.mensaje || errorData.error || `Error ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  // 204 No Content
  if (response.status === 204) {
    return null;
  }

  return await response.json();
}
