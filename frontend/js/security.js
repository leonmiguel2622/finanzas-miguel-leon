// security.js - Utilidades de seguridad frontend
// Nota: bloquear F12/click derecho es ofuscación, no seguridad real. Un usuario avanzado puede bypasearlo.
// Se implementa por requerimiento, pero la seguridad real está en backend (bcrypt, validación, CORS, SQL param).

/* Cookies helpers - SameSite Lax, path=/, expiry 7 días */
function setCookie(name, value, days=7){
  const expires = new Date(Date.now() + days*864e5).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}
function getCookie(name){
  const m = document.cookie.match(new RegExp('(?:^|; )'+encodeURIComponent(name)+'=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}
function deleteCookie(name){
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}
function clearSession(){
  deleteCookie('id_usuario'); deleteCookie('nombre'); deleteCookie('correo');
  try{ localStorage.removeItem('id_usuario'); localStorage.removeItem('nombre'); localStorage.removeItem('correo'); }catch(e){}
}

/* Validación */
function isValidEmail(email){
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
}
function isValidPassword(p){ return typeof p==='string' && p.length>=8 && p.length<=72; }

/* Bloqueo inspección - solo si body tiene data-secure="true" */
(function(){
  const secure = document.body && document.body.getAttribute('data-secure') === 'true';
  if(!secure) return;
  // Click derecho
  document.addEventListener('contextmenu', e => { e.preventDefault(); toastSecure('Click derecho deshabilitado'); });
  // Teclas: F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S
  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if(e.key === 'F12' ||
       (e.ctrlKey && e.shiftKey && ['i','j','c'].includes(k)) ||
       (e.ctrlKey && ['u','s'].includes(k))){
      e.preventDefault();
      toastSecure('Acción deshabilitada por seguridad');
      return false;
    }
  });
  // Evitar arrastrar imágenes, selección extra? (opcional suave)
  // No bloqueamos selección de texto para accesibilidad.

  let toastTimer;
  function toastSecure(msg){
    let el = document.getElementById('secure-toast');
    if(!el){
      el = document.createElement('div');
      el.id='secure-toast';
      el.setAttribute('role','status');
      el.setAttribute('aria-live','polite');
      el.style.cssText='position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:#1E1B4B;color:white;padding:10px 14px;border-radius:10px;font-size:0.85rem;box-shadow:0 8px 24px rgba(0,0,0,0.2);z-index:9999;opacity:0;transition:opacity .2s';
      document.body.appendChild(el);
    }
    el.textContent=msg;
    el.style.opacity='1';
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=> el.style.opacity='0', 2000);
  }

  // Detectar devtools abierto por resize (heurística simple)
  // No bloquea, solo avisa. No es fiable.
})();
