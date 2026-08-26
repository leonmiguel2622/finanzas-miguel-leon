const USER_ID = parseInt((typeof getCookie==='function' ? getCookie('id_usuario') : null) || localStorage.getItem('id_usuario')||'0');
const USER_NOMBRE = (typeof getCookie==='function' ? getCookie('nombre') : null) || localStorage.getItem('nombre')||'';
if(!USER_ID){
  location.href='login.html';
}

document.getElementById('user-info').textContent = `${USER_NOMBRE} (#${USER_ID})`;
document.getElementById('btn-logout').addEventListener('click', ()=>{
  if(typeof clearSession==='function') clearSession();
  else {
    localStorage.removeItem('id_usuario');
    localStorage.removeItem('nombre');
    localStorage.removeItem('correo');
  }
  location.href='login.html';
});

// Helpers
function fmtMoney(n){ return `$${Number(n).toLocaleString('es-CO', {maximumFractionDigits:0})}`; }
function showLoadingTabla(id, colSpan){ document.getElementById(id).innerHTML=`<tr><td colspan="${colSpan}" class="loading">Cargando...</td></tr>`; }

// Estado filtros resumen
let filtroMes = '';
let filtroDesde = '';
let filtroHasta = '';

async function cargarCategorias(){
  try{
    const cats = await apiGetCategorias(USER_ID);
    // Select form movimiento
    const sel = document.getElementById('categoria');
    const filtroCat = document.getElementById('filtro-cat-tabla');
    // Filtrar según tipo seleccionado dinámicamente
    const tipoSel = document.getElementById('tipo').value;
    const catsFiltradas = cats.filter(c=>c.tipo===tipoSel);

    sel.innerHTML = catsFiltradas.map(c=> `<option value="${c.id_categoria}">${c.nombre} (${c.tipo})</option>`).join('');
    if(catsFiltradas.length===0) sel.innerHTML='<option value="">No hay categorías de este tipo</option>';

    // Filtro tabla
    filtroCat.innerHTML = '<option value="">Todas categorías</option>' + cats.map(c=> `<option value="${c.id_categoria}">${c.nombre}</option>`).join('');

    // Tabla categorías
    const tbody = document.getElementById('tabla-categorias');
    if(cats.length===0){
      tbody.innerHTML='<tr><td colspan="3" class="empty">No hay categorías</td></tr>';
    } else {
      tbody.innerHTML = cats.map(c=> `
        <tr>
          <td>${c.nombre}</td>
          <td><span class="badge ${c.tipo==='ingreso'?'badge-ingreso':'badge-gasto'}">${c.tipo}</span></td>
          <td>
            <button class="btn btn-ghost btn-small" onclick="editarCategoria(${c.id_categoria}, '${c.nombre.replace(/'/g,"\\'")}', '${c.tipo}')">Editar</button>
            <button class="btn btn-danger btn-small" onclick="eliminarCategoria(${c.id_categoria})">Eliminar</button>
          </td>
        </tr>
      `).join('');
    }
    // Guardar para uso global
    window._categorias = cats;
    return cats;
  }catch(e){
    console.error(e);
    document.getElementById('tabla-categorias').innerHTML=`<tr><td colspan="3" class="msg error show">${e.message}</td></tr>`;
  }
}

async function cargarResumen(){
  try{
    const extra={};
    if(filtroMes) extra.mes=filtroMes;
    else{
      if(filtroDesde) extra.desde=filtroDesde;
      if(filtroHasta) extra.hasta=filtroHasta;
    }
    const data = await apiGetResumen(USER_ID, extra);
    document.getElementById('card-ingresos').textContent = fmtMoney(data.total_ingresos);
    document.getElementById('card-gastos').textContent = fmtMoney(data.total_gastos);
    const balEl=document.getElementById('card-balance');
    balEl.textContent = fmtMoney(data.balance);
    balEl.classList.toggle('monto-negativo', data.balance < 0);
    document.getElementById('card-balance-sub').textContent = `${data.porcentaje_ahorro}% ahorro · ${data.total_movimientos} movs`;
    // Gráficos con datos reales
    renderDona(data.gastos_por_categoria);
    renderTendencia(data.tendencia_mensual);
  }catch(e){
    console.error(e);
  }
}

async function cargarPrediccion(){
  try{
    const data = await apiGetPrediccion(USER_ID);
    document.getElementById('card-prediccion').textContent = fmtMoney(data.prediccion||data.prediccion_proximo_mes||0);
    const sub = document.getElementById('card-prediccion-sub');
    sub.textContent = `${data.confianza} · ${data.razon||data.metodo||''}`;
    if(data.detalle_por_categoria && Object.keys(data.detalle_por_categoria).length){
      sub.title = Object.entries(data.detalle_por_categoria).map(([k,v])=>`${k}: $${Number(v).toLocaleString('es-CO')}`).join(' | ');
    }
  }catch(e){
    document.getElementById('card-prediccion').textContent='—';
    document.getElementById('card-prediccion-sub').textContent=e.message;
  }
}

async function cargarAnomalias(){
  try{
    const data = await apiGetAnomalias(USER_ID);
    const box=document.getElementById('alerta-anomalias');
    const ul=document.getElementById('lista-anomalias');
    const meta=document.getElementById('anomalias-meta');
    if(data.anomalias && data.anomalias.length>0){
      box.classList.add('show');
      ul.innerHTML = data.anomalias.map(a=> `<li><strong>${a.categoria}</strong> ${a.fecha}: ${fmtMoney(a.monto)} (prom. ${fmtMoney(a.promedio_categoria)}, Z=${a.z_score}) — ${a.descripcion||'sin descripción'}</li>`).join('');
      meta.textContent = `Umbral Z>|${data.umbral_z}| · ${data.total_anomalias} detectadas`;
    } else {
      box.classList.remove('show');
    }
  }catch(e){
    console.error(e);
  }
}

async function cargarMovimientos(){
  showLoadingTabla('tabla-movimientos',6);
  try{
    const params={ id_usuario: USER_ID, limit: 100 };
    const cat = document.getElementById('filtro-cat-tabla').value;
    const tipo = document.getElementById('filtro-tipo-tabla').value;
    if(cat) params.categoria=cat;
    if(tipo) params.tipo=tipo;
    if(filtroMes){
      // si hay mes, limitar a ese mes
      const [y,m]=filtroMes.split('-');
      const last = new Date(parseInt(y), parseInt(m),0).getDate();
      params.desde=`${y}-${m}-01`;
      params.hasta=`${y}-${m}-${String(last).padStart(2,'0')}`;
    } else {
      if(filtroDesde) params.desde=filtroDesde;
      if(filtroHasta) params.hasta=filtroHasta;
    }
    const rows = await apiGetMovimientos(params);
    const tbody=document.getElementById('tabla-movimientos');
    if(rows.length===0){
      tbody.innerHTML='<tr><td colspan="6" class="empty">Sin movimientos para los filtros actuales</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(r=> `
      <tr>
        <td>${r.fecha}</td>
        <td>${r.categoria_nombre}</td>
        <td><span class="badge ${r.tipo==='ingreso'?'badge-ingreso':'badge-gasto'}">${r.tipo}</span></td>
        <td class="${r.tipo==='ingreso'?'monto-ingreso':'monto-gasto'}">${fmtMoney(r.monto)}</td>
        <td><span class="descripcion-cell">${r.descripcion||''}</span></td>
        <td>
          <button class="btn btn-ghost btn-small" onclick="editarMovimiento(${r.id_movimiento})">Editar</button>
          <button class="btn btn-danger btn-small" onclick="eliminarMovimiento(${r.id_movimiento})">Eliminar</button>
        </td>
      </tr>
    `).join('');
  }catch(e){
    document.getElementById('tabla-movimientos').innerHTML=`<tr><td colspan="6" class="msg error show">${e.message}</td></tr>`;
  }
}

// Eventos filtros resumen
document.getElementById('btn-filtrar').addEventListener('click', async()=>{
  filtroMes=document.getElementById('filtro-mes').value;
  filtroDesde=document.getElementById('filtro-desde').value;
  filtroHasta=document.getElementById('filtro-hasta').value;
  await cargarResumen();
  await cargarMovimientos();
});
document.getElementById('btn-limpiar').addEventListener('click', async()=>{
  document.getElementById('filtro-mes').value='';
  document.getElementById('filtro-desde').value='';
  document.getElementById('filtro-hasta').value='';
  filtroMes=''; filtroDesde=''; filtroHasta='';
  await cargarResumen();
  await cargarMovimientos();
});
document.getElementById('filtro-cat-tabla').addEventListener('change', cargarMovimientos);
document.getElementById('filtro-tipo-tabla').addEventListener('change', cargarMovimientos);
document.getElementById('tipo').addEventListener('change', cargarCategorias);

// Crear categoría
document.getElementById('form-categoria').addEventListener('submit', async(e)=>{
  e.preventDefault();
  const nombre = document.getElementById('cat-nombre').value.trim();
  const tipo = document.getElementById('cat-tipo').value;
  if(nombre.length < 2){ alert('Nombre de categoría mínimo 2 caracteres'); return; }
  if(!['ingreso','gasto'].includes(tipo)){ alert('Tipo inválido'); return; }
  const payload={ nombre, tipo, id_usuario: USER_ID };
  try{
    await apiCreateCategoria(payload);
    document.getElementById('form-categoria').reset();
    await cargarCategorias();
  }catch(err){ alert(err.message); }
});

window.editarCategoria = async(id, nombre, tipo)=>{
  const nuevoNombre = prompt('Nuevo nombre:', nombre);
  if(nuevoNombre===null) return;
  const nuevoTipo = prompt('Tipo (ingreso/gasto):', tipo);
  if(!nuevoTipo || !['ingreso','gasto'].includes(nuevoTipo)) { alert('Tipo inválido'); return; }
  try{
    await apiUpdateCategoria(id, {nombre: nuevoNombre.trim(), tipo: nuevoTipo});
    await cargarCategorias();
  }catch(e){ alert(e.message); }
};
window.eliminarCategoria = async(id)=>{
  if(!confirm('¿Eliminar categoría? No debe tener movimientos.')) return;
  try{ await apiDeleteCategoria(id); await cargarCategorias(); }catch(e){ alert(e.message); }
};

// Movimientos: crear/editar
document.getElementById('form-movimiento').addEventListener('submit', async(e)=>{
  e.preventDefault();
  const editId = document.getElementById('edit-id').value;
  const payload={
    id_usuario: USER_ID,
    id_categoria: parseInt(document.getElementById('categoria').value),
    tipo: document.getElementById('tipo').value,
    monto: parseFloat(document.getElementById('monto').value),
    fecha: document.getElementById('fecha').value,
    descripcion: document.getElementById('descripcion').value.trim()||null
  };
  if(!payload.id_categoria){ alert('Selecciona categoría'); return; }
  if(!payload.monto || isNaN(payload.monto) || payload.monto<=0){ alert('Monto debe ser mayor a 0'); return; }
  if(!payload.fecha){ alert('Fecha requerida'); return; }
  // Validar fecha no muy futura (máximo hoy)
  const hoy = new Date().toISOString().split('T')[0];
  if(payload.fecha > hoy){ alert('La fecha no puede ser futura'); return; }
  if(payload.descripcion && payload.descripcion.length>255){ alert('Descripción máximo 255 caracteres'); return; }
  try{
    if(editId){
      await apiUpdateMovimiento(editId, { id_categoria: payload.id_categoria, tipo: payload.tipo, monto: payload.monto, fecha: payload.fecha, descripcion: payload.descripcion });
      document.getElementById('edit-id').value='';
      document.querySelector('#form-movimiento button[type="submit"]').textContent='Guardar';
      document.getElementById('btn-cancelar-edicion').classList.add('hidden');
    } else {
      await apiCreateMovimiento(payload);
    }
    e.target.reset();
    await recargarTodo();
  }catch(err){ alert(err.message); }
});

document.getElementById('btn-cancelar-edicion').addEventListener('click', ()=>{
  document.getElementById('edit-id').value='';
  document.getElementById('form-movimiento').reset();
  document.querySelector('#form-movimiento button[type="submit"]').textContent='Guardar';
  document.getElementById('btn-cancelar-edicion').classList.add('hidden');
});

window.editarMovimiento = async(id)=>{
  try{
    const r = await apiFetch(`/movimientos/${id}`);
    document.getElementById('edit-id').value = id;
    document.getElementById('monto').value = r.monto;
    document.getElementById('fecha').value = r.fecha;
    document.getElementById('tipo').value = r.tipo;
    await cargarCategorias();
    // esperar que cargue selects y luego setear categoria
    setTimeout(()=>{ document.getElementById('categoria').value = r.id_categoria; },150);
    document.getElementById('descripcion').value = r.descripcion||'';
    document.querySelector('#form-movimiento button[type="submit"]').textContent='Actualizar';
    document.getElementById('btn-cancelar-edicion').classList.remove('hidden');
    window.scrollTo({top: document.getElementById('form-movimiento').offsetTop -80, behavior:'smooth'});
  }catch(e){ alert(e.message); }
};
window.eliminarMovimiento = async(id)=>{
  if(!confirm('¿Eliminar movimiento?')) return;
  try{ await apiDeleteMovimiento(id); await recargarTodo(); }catch(e){ alert(e.message); }
};

async function recargarTodo(){
  await cargarCategorias();
  await cargarResumen();
  await cargarMovimientos();
  await cargarPrediccion();
  await cargarAnomalias();
}

// Init
document.getElementById('fecha').valueAsDate = new Date();
recargarTodo();
