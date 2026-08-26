let chartDona = null;
let chartTendencia = null;

const PALETTE = ['#7C3AED','#10B981','#F59E0B','#EF4444','#06B6D4','#EC4899','#8B5CF6','#F97316','#14B8A6','#EAB308'];

function renderDona(porCategoria){
  const ctx = document.getElementById('chartCategorias');
  const empty = document.getElementById('chartCategorias-empty');
  if(!ctx) return;
  if(!porCategoria || porCategoria.length===0){
    if(chartDona){ chartDona.destroy(); chartDona=null; }
    ctx.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }
  ctx.classList.remove('hidden');
  empty.classList.add('hidden');
  const labels = porCategoria.map(c=>c.categoria);
  const data = porCategoria.map(c=>c.total);
  const backgroundColor = labels.map((_,i)=> PALETTE[i % PALETTE.length]);

  if(chartDona) chartDona.destroy();
  chartDona = new Chart(ctx, {
    type:'doughnut',
    data:{ labels, datasets:[{ data, backgroundColor, borderWidth:2, borderColor:'#fff' }]},
    options:{
      responsive:true,
      maintainAspectRatio:false,
      plugins:{
        legend:{ position:'bottom', labels:{ padding:14, usePointStyle:true }},
        title:{ display:true, text:'Distribución de gastos', font:{ weight:'700' }},
        tooltip:{ callbacks:{ label: ctx=> `${ctx.label}: $${ctx.raw.toLocaleString('es-CO')}` }}
      }
    }
  });
}

function renderTendencia(tendencia){
  const ctx = document.getElementById('chartTendencia');
  const empty = document.getElementById('chartTendencia-empty');
  if(!ctx) return;
  if(!tendencia || tendencia.length===0){
    if(chartTendencia){ chartTendencia.destroy(); chartTendencia=null; }
    ctx.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }
  ctx.classList.remove('hidden');
  empty.classList.add('hidden');
  const labels = tendencia.map(t=>t.mes);
  const ingresos = tendencia.map(t=>t.ingresos);
  const gastos = tendencia.map(t=>t.gastos);

  if(chartTendencia) chartTendencia.destroy();
  chartTendencia = new Chart(ctx, {
    type:'line',
    data:{
      labels,
      datasets:[
        { label:'Ingresos', data:ingresos, borderColor:'#10B981', backgroundColor:'rgba(16,185,129,0.08)', fill:true, tension:0.35, pointRadius:4, pointBackgroundColor:'#10B981' },
        { label:'Gastos', data:gastos, borderColor:'#EF4444', backgroundColor:'rgba(239,68,68,0.08)', fill:true, tension:0.35, pointRadius:4, pointBackgroundColor:'#EF4444' }
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      interaction:{ mode:'index', intersect:false },
      plugins:{
        legend:{ position:'bottom' },
        title:{ display:true, text:'Ingresos vs Gastos por mes', font:{ weight:'700' }},
        tooltip:{ callbacks:{ label: ctx=> `${ctx.dataset.label}: $${ctx.raw.toLocaleString('es-CO')}` }}
      },
      scales:{
        y:{ beginAtZero:true, ticks:{ callback: v=> '$'+Number(v).toLocaleString('es-CO') } }
      }
    }
  });
}
