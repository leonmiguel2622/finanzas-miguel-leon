let chartDona = null;
let chartTendencia = null;

// Palette — editorial, not slop (5 muted + tinted, not 10 screaming)
const PALETTE = ['#6D28D9','#0E9F6E','#D97706','#0E7A9F','#9F1239','#4338CA'];

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
    data:{ labels, datasets:[{ data, backgroundColor, borderWidth:2, borderColor:'#fff', hoverOffset:6 }]},
    options:{
      responsive:true,
      maintainAspectRatio:false,
      animation:{ duration:520, easing:'easeOutQuart' },
      plugins:{
        legend:{ position:'bottom', labels:{ padding:14, usePointStyle:true, font:{ family:'Instrument Sans' } }},
        title:{ display:true, text:'Distribución de gastos', font:{ weight:'700', family:'Instrument Sans' }},
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
        { label:'Ingresos', data:ingresos, borderColor:'#0E9F6E', backgroundColor:'rgba(14,159,110,0.08)', fill:true, tension:0.38, pointRadius:3, pointHoverRadius:5, pointBackgroundColor:'#0E9F6E', borderWidth:2 },
        { label:'Gastos', data:gastos, borderColor:'#DC2626', backgroundColor:'rgba(220,38,38,0.07)', fill:true, tension:0.38, pointRadius:3, pointHoverRadius:5, pointBackgroundColor:'#DC2626', borderWidth:2 }
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      animation:{ duration:620, easing:'easeOutQuart' },
      interaction:{ mode:'index', intersect:false },
      plugins:{
        legend:{ position:'bottom', labels:{ font:{ family:'Instrument Sans' } } },
        title:{ display:true, text:'Ingresos vs Gastos por mes', font:{ weight:'700', family:'Instrument Sans' }},
        tooltip:{ callbacks:{ label: ctx=> `${ctx.dataset.label}: $${ctx.raw.toLocaleString('es-CO')}` }}
      },
      scales:{
        y:{ beginAtZero:true, grid:{ color:'#F3F0FF' }, ticks:{ callback: v=> '$'+Number(v).toLocaleString('es-CO'), font:{ family:'JetBrains Mono' } } },
        x:{ grid:{ display:false }, ticks:{ font:{ family:'Instrument Sans' } } }
      }
    }
  });
}
