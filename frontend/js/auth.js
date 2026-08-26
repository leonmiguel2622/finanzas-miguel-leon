// auth.js - Lógica login / register sin JS inline en HTML
document.addEventListener('DOMContentLoaded', ()=>{
  const loginForm = document.getElementById('form-login');
  const registerForm = document.getElementById('form-register');

  function showMsg(text, type){
    const el = document.getElementById('msg');
    if(!el) return;
    el.textContent = text;
    el.className = 'msg show ' + (type==='error'?'error':'success');
  }

  if(loginForm){
    loginForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const correo = document.getElementById('correo').value.trim().toLowerCase();
      const contrasena = document.getElementById('contrasena').value;
      if(typeof isValidEmail==='function' && !isValidEmail(correo)){ showMsg('Correo no válido','error'); return; }
      if(typeof isValidPassword==='function' && !isValidPassword(contrasena)){ showMsg('Contraseña 8-72 caracteres','error'); return; }
      const btn = loginForm.querySelector('button');
      btn.disabled=true; const old=btn.textContent; btn.textContent='Ingresando...';
      try{
        const data = await apiLogin(correo, contrasena);
        // Guardar sesión en cookies (7d) + localStorage fallback
        if(typeof setCookie==='function'){
          setCookie('id_usuario', data.id_usuario, 7);
          setCookie('nombre', data.nombre, 7);
          setCookie('correo', data.correo, 7);
        }
        try{ localStorage.setItem('id_usuario', data.id_usuario); localStorage.setItem('nombre', data.nombre); localStorage.setItem('correo', data.correo); }catch(e){}
        showMsg('¡Bienvenido '+data.nombre+'! Redirigiendo...','success');
        // Redirigir según ubicación (root vs frontend)
        const isFrontend = location.pathname.includes('/frontend/');
        setTimeout(()=> location.href = isFrontend ? 'index.html' : 'frontend/index.html', 800);
      }catch(err){
        showMsg(err.message||'Error al ingresar','error');
      }finally{
        btn.disabled=false; btn.textContent=old;
      }
    });
  }

  if(registerForm){
    registerForm.addEventListener('submit', async(e)=>{
      e.preventDefault();
      const nombre = document.getElementById('nombre').value.trim();
      const correo = document.getElementById('correo').value.trim().toLowerCase();
      const contrasena = document.getElementById('contrasena').value;
      if(nombre.length<2){ showMsg('Nombre mínimo 2 caracteres','error'); return; }
      if(typeof isValidEmail==='function' && !isValidEmail(correo)){ showMsg('Correo no válido','error'); return; }
      if(typeof isValidPassword==='function' && !isValidPassword(contrasena)){ showMsg('Contraseña 8-72 caracteres','error'); return; }
      // Validar términos si existe checkbox
      const terms = document.getElementById('terms-check');
      if(terms && !terms.checked){ showMsg('Debes aceptar Términos y Cookies','error'); return; }
      const btn = registerForm.querySelector('button');
      btn.disabled=true; const old=btn.textContent; btn.textContent='Creando...';
      try{
        await apiRegister({nombre, correo, contrasena});
        showMsg('¡Cuenta creada! Redirigiendo al login...','success');
        const isFrontend = location.pathname.includes('/frontend/');
        setTimeout(()=> location.href = isFrontend ? 'login.html' : 'frontend/login.html', 1200);
      }catch(err){
        showMsg(err.message,'error');
      }finally{
        btn.disabled=false; btn.textContent=old;
      }
    });
  }
});
