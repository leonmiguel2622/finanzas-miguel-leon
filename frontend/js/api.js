const API_URL = (() => {
  try{
    // override con cookie o localStorage para deploy
    const c = document.cookie.match(/(?:^|; )API_URL=([^;]*)/);
    if(c) return decodeURIComponent(c[1]);
  }catch(e){}
  const stored = localStorage.getItem('API_URL');
  if(stored) return stored;
  // Auto-detect producción: GitHub Pages -> Render, local -> localhost
  if(location.hostname.includes('github.io') || location.hostname.includes('onrender.com')){
    return 'https://finanzas-miguel-leon.onrender.com/api';
  }
  return 'http://127.0.0.1:8000/api';
})();

// Mock para GitHub Pages sin backend (cuando Render está caído)
function isMockMode(){ return location.hostname.includes('github.io'); }
function getMockDB(){
  try{ return JSON.parse(localStorage.getItem('mockDB')||'null'); }catch{ return null; }
}
function saveMockDB(db){ localStorage.setItem('mockDB', JSON.stringify(db)); }
function initMockDB(){
  let db = getMockDB();
  if(db) return db;
  db = {
    usuarios: [{id_usuario:1, nombre:'Ana Torres', correo:'ana@example.com', contrasena:'12345678'}],
    categorias: [
      {id_categoria:1, nombre:'Salario', tipo:'ingreso', id_usuario:1},
      {id_categoria:2, nombre:'Freelance', tipo:'ingreso', id_usuario:1},
      {id_categoria:3, nombre:'Alimentación', tipo:'gasto', id_usuario:1},
      {id_categoria:4, nombre:'Transporte', tipo:'gasto', id_usuario:1},
      {id_categoria:5, nombre:'Entretenimiento', tipo:'gasto', id_usuario:1},
      {id_categoria:6, nombre:'Salud', tipo:'gasto', id_usuario:1},
    ],
    movimientos: [
      {id_movimiento:1, id_usuario:1, id_categoria:1, tipo:'ingreso', monto:2500000, fecha:'2026-02-01', descripcion:'Pago mensual Feb', categoria_nombre:'Salario'},
      {id_movimiento:2, id_usuario:1, id_categoria:3, tipo:'gasto', monto:280000, fecha:'2026-02-05', descripcion:'Mercado Feb', categoria_nombre:'Alimentación'},
      {id_movimiento:3, id_usuario:1, id_categoria:4, tipo:'gasto', monto:85000, fecha:'2026-02-07', descripcion:'Transporte Feb', categoria_nombre:'Transporte'},
      {id_movimiento:4, id_usuario:1, id_categoria:5, tipo:'gasto', monto:120000, fecha:'2026-02-10', descripcion:'Cine Feb', categoria_nombre:'Entretenimiento'},
      {id_movimiento:5, id_usuario:1, id_categoria:1, tipo:'ingreso', monto:2500000, fecha:'2026-03-01', descripcion:'Pago mensual Mar', categoria_nombre:'Salario'},
      {id_movimiento:6, id_usuario:1, id_categoria:3, tipo:'gasto', monto:310000, fecha:'2026-03-05', descripcion:'Mercado Mar', categoria_nombre:'Alimentación'},
      {id_movimiento:7, id_usuario:1, id_categoria:6, tipo:'gasto', monto:70000, fecha:'2026-03-20', descripcion:'Farmacia Mar', categoria_nombre:'Salud'},
      {id_movimiento:8, id_usuario:1, id_categoria:1, tipo:'ingreso', monto:2500000, fecha:'2026-06-01', descripcion:'Pago mensual', categoria_nombre:'Salario'},
      {id_movimiento:9, id_usuario:1, id_categoria:3, tipo:'gasto', monto:320000, fecha:'2026-06-05', descripcion:'Mercado del mes', categoria_nombre:'Alimentación'},
      {id_movimiento:10, id_usuario:1, id_categoria:6, tipo:'gasto', monto:800000, fecha:'2026-07-15', descripcion:'Consulta médica de urgencia', categoria_nombre:'Salud'},
    ],
    nextId:{usuario:2, categoria:7, movimiento:11}
  };
  saveMockDB(db);
  return db;
}
function mockApi(path, options={}){
  const db = initMockDB();
  const method = (options.method||'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : null;
  // Auth login
  if(path.startsWith('/auth/login') && method==='POST'){
    const u = db.usuarios.find(x=> x.correo===body.correo && x.contrasena===body.contrasena);
    if(!u) throw new Error('Credenciales inválidas (modo demo: usa ana@example.com / 12345678)');
    return {id_usuario:u.id_usuario, nombre:u.nombre, correo:u.correo, mensaje:'Login exitoso (demo)'};
  }
  if(path.startsWith('/usuarios') && method==='POST'){
    if(db.usuarios.find(x=> x.correo===body.correo)) throw new Error('El correo ya está registrado');
    const id = db.nextId.usuario++;
    db.usuarios.push({id_usuario:id, nombre:body.nombre, correo:body.correo, contrasena:body.contrasena});
    // crea 6 cats por defecto si no existen
    ['Salario','Freelance','Alimentación','Transporte','Entretenimiento','Salud'].forEach((n,i)=>{
      const tipo = i<2?'ingreso':'gasto';
      db.categorias.push({id_categoria:db.nextId.categoria++, nombre:n, tipo, id_usuario:id});
    });
    saveMockDB(db);
    return {id_usuario:id, nombre:body.nombre, correo:body.correo, mensaje:'Usuario creado (demo)'};
  }
  if(path.startsWith('/categorias')){
    const url = new URL('http://x'+path);
    const id_usuario = parseInt(url.searchParams.get('id_usuario')||'1');
    if(method==='GET'){
      return db.categorias.filter(c=> c.id_usuario===id_usuario);
    }
    if(method==='POST'){
      if(db.categorias.find(c=> c.id_usuario===body.id_usuario && c.nombre===body.nombre)) throw new Error('Ya existe esa categoría');
      const cat={id_categoria:db.nextId.categoria++, nombre:body.nombre, tipo:body.tipo, id_usuario:body.id_usuario};
      db.categorias.push(cat); saveMockDB(db);
      return {id_categoria:cat.id_categoria, mensaje:'Categoría creada (demo)'};
    }
    const m = path.match(/\/categorias\/(\d+)/);
    if(m){
      const id=parseInt(m[1]);
      if(method==='PUT'){
        const c=db.categorias.find(x=> x.id_categoria===id);
        if(c){ c.nombre=body.nombre||c.nombre; c.tipo=body.tipo||c.tipo; saveMockDB(db); }
        return {mensaje:'Categoría actualizada (demo)'};
      }
      if(method==='DELETE'){
        if(db.movimientos.find(x=> x.id_categoria===id)) throw new Error('No se puede eliminar: tiene movimientos asociados');
        db.categorias=db.categorias.filter(x=> x.id_categoria!==id); saveMockDB(db);
        return {mensaje:'Categoría eliminada (demo)'};
      }
    }
  }
  if(path.startsWith('/movimientos')){
    const url = new URL('http://x'+path);
    if(method==='GET' && !path.match(/\/movimientos\/\d+/)){
      let rows=[...db.movimientos].filter(x=> x.id_usuario===parseInt(url.searchParams.get('id_usuario')||'1'));
      const cat=url.searchParams.get('categoria'); const tipo=url.searchParams.get('tipo');
      if(cat) rows=rows.filter(x=> x.id_categoria===parseInt(cat));
      if(tipo) rows=rows.filter(x=> x.tipo===tipo);
      return rows.sort((a,b)=> b.fecha.localeCompare(a.fecha)).slice(0, parseInt(url.searchParams.get('limit')||'100'));
    }
    if(method==='POST'){
      const cat=db.categorias.find(c=> c.id_categoria===body.id_categoria);
      const row={id_movimiento:db.nextId.movimiento++, id_usuario:body.id_usuario, id_categoria:body.id_categoria, tipo:body.tipo, monto:parseFloat(body.monto), fecha:body.fecha, descripcion:body.descripcion||'', categoria_nombre:cat?cat.nombre:'', fecha_creacion:new Date().toISOString()};
      db.movimientos.push(row); saveMockDB(db);
      return {id_movimiento:row.id_movimiento, mensaje:'Movimiento registrado (demo)'};
    }
    const m=path.match(/\/movimientos\/(\d+)/);
    if(m){
      const id=parseInt(m[1]);
      if(method==='GET'){
        const r=db.movimientos.find(x=> x.id_movimiento===id);
        if(!r) throw new Error('Movimiento no encontrado');
        return r;
      }
      if(method==='PUT'){
        const r=db.movimientos.find(x=> x.id_movimiento===id);
        if(r){ Object.assign(r, body); if(body.monto) r.monto=parseFloat(body.monto); saveMockDB(db); }
        return {mensaje:'Movimiento actualizado (demo)'};
      }
      if(method==='DELETE'){
        db.movimientos=db.movimientos.filter(x=> x.id_movimiento!==id); saveMockDB(db);
        return {mensaje:'Movimiento eliminado (demo)'};
      }
    }
  }
  if(path.startsWith('/resumen')){
    const url=new URL('http://x'+path);
    const id_usuario=parseInt(url.searchParams.get('id_usuario')||'1');
    const rows=db.movimientos.filter(x=> x.id_usuario===id_usuario);
    const ingresos=rows.filter(x=>x.tipo==='ingreso').reduce((a,b)=>a+b.monto,0);
    const gastos=rows.filter(x=>x.tipo==='gasto').reduce((a,b)=>a+b.monto,0);
    const porCat={};
    rows.filter(x=>x.tipo==='gasto').forEach(x=>{
      const c=db.categorias.find(cat=>cat.id_categoria===x.id_categoria);
      const k=c?c.nombre:x.categoria_nombre;
      porCat[k]=(porCat[k]||0)+x.monto;
    });
    const por_categoria=Object.entries(porCat).map(([categoria,total])=>({categoria, total, cantidad:1}));
    const porMes={};
    rows.forEach(x=>{
      const m=x.fecha.substring(0,7);
      if(!porMes[m]) porMes[m]={mes:m, ingresos:0, gastos:0};
      if(x.tipo==='ingreso') porMes[m].ingresos+=x.monto; else porMes[m].gastos+=x.monto;
    });
    return {id_usuario, total_ingresos:ingresos, total_gastos:gastos, balance:ingresos-gastos, porcentaje_ahorro: ingresos? Math.round((ingresos-gastos)/ingresos*100*100)/100:0, total_movimientos:rows.length, gastos_por_categoria:por_categoria, tendencia_mensual:Object.values(porMes).sort((a,b)=>a.mes.localeCompare(b.mes))};
  }
  if(path.startsWith('/analitica/prediccion')){
    return {prediccion:420000, prediccion_proximo_mes:420000, confianza:'media', razon:'Regresión lineal con 5 meses (demo)', metodo:'regresion_lineal', detalle_por_categoria:{'Alimentación':310000, 'Salud':285000}};
  }
  if(path.startsWith('/analitica/anomalias')){
    const url=new URL('http://x'+path);
    const umbral=parseFloat(url.searchParams.get('umbral')||'1.5');
    // anomalía Salud 800k
    return {id_usuario:1, umbral_z:umbral, total_anomalias:1, anomalias:[{id_movimiento:10, fecha:'2026-07-15', id_categoria:6, categoria:'Salud', monto:800000, descripcion:'Consulta médica de urgencia', promedio_categoria:120000, desviacion_categoria:320000, z_score:2.1, umbral}]};
  }
  throw new Error('Mock no implementado: '+path);
}

async function apiFetch(path, options = {}) {
  // En GitHub Pages usa mock instantáneo (evita 15s timeout a Render caído)
  if(isMockMode()){
    return mockApi(path, options);
  }
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
