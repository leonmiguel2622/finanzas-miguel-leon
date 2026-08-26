const API_URL = (() => {
  // Permite override con localStorage API_URL para deploy
  return localStorage.getItem('API_URL') || 'http://127.0.0.1:8000/api';
})();

async function apiFetch(path, options = {}) {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers||{}) },
    ...options
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = (data && data.detail) ? (Array.isArray(data.detail) ? data.detail.map(d=>d.msg||JSON.stringify(d)).join(', ') : data.detail) : (data && data.mensaje ? data.mensaje : `Error ${res.status}`);
    throw new Error(msg);
  }
  return data;
}

// Auth
function apiRegister(payload){
  return apiFetch('/usuarios', { method:'POST', body: JSON.stringify(payload) });
}
function apiLogin(correo, contrasena){
  return apiFetch('/auth/login', { method:'POST', body: JSON.stringify({correo, contrasena}) });
}

// Categorias
function apiGetCategorias(id_usuario){
  return apiFetch(`/categorias?id_usuario=${id_usuario}`);
}
function apiCreateCategoria(payload){
  return apiFetch('/categorias', { method:'POST', body: JSON.stringify(payload) });
}
function apiUpdateCategoria(id, payload){
  return apiFetch(`/categorias/${id}`, { method:'PUT', body: JSON.stringify(payload) });
}
function apiDeleteCategoria(id){
  return apiFetch(`/categorias/${id}`, { method:'DELETE' });
}

// Movimientos
function apiGetMovimientos(params){
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/movimientos?${qs}`);
}
function apiCreateMovimiento(payload){
  return apiFetch('/movimientos', { method:'POST', body: JSON.stringify(payload) });
}
function apiUpdateMovimiento(id, payload){
  return apiFetch(`/movimientos/${id}`, { method:'PUT', body: JSON.stringify(payload) });
}
function apiDeleteMovimiento(id){
  return apiFetch(`/movimientos/${id}`, { method:'DELETE' });
}

// Resumen
function apiGetResumen(id_usuario, extra={}){
  const p = new URLSearchParams({id_usuario, ...extra});
  // limpiar vacíos
  for(const [k,v] of [...p.entries()]) if(!v) p.delete(k);
  return apiFetch(`/resumen?${p.toString()}`);
}

// Analitica
function apiGetPrediccion(id_usuario){
  return apiFetch(`/analitica/prediccion?id_usuario=${id_usuario}`);
}
function apiGetAnomalias(id_usuario){
  return apiFetch(`/analitica/anomalias?id_usuario=${id_usuario}`);
}
