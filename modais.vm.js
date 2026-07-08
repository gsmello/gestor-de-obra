// ============================================================
// viewmodels/carteira.vm.js — VIEW-MODEL do ecrã CARTEIRA
// Produz: kpis, chips (filtros), rows+cols (tabela), chart (barras por obra).
// Recebe: (obras, state, opts, on).
//   opts = { ACC, compact, realLow }
//   on   = handlers (open, sort, setFiltro)
// ============================================================
import * as fmt from '../core/format.js';
import * as theme from '../core/theme.js';
import { calc, carteiraTotais, fluxoCarteira, faturadoReal } from '../core/calc.js';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  const GRID = '104px minmax(190px,1.6fr) minmax(130px,1fr) 118px 122px 122px 112px 108px 82px 44px';

export function buildCarteira(obras, state, opts, on){
  const E0 = fmt.EUR0, P = fmt.PCT1;
  const ACC = opts.ACC, compact = opts.compact, realLow = opts.realLow;

  const t = carteiraTotais(obras, state);

  // ---- Dashboard mensal/anual (faturado / custos / lucro no tempo) ----
  const fluxo = fluxoCarteira(obras, state);
  const anoAtual = String(new Date().getFullYear());
  const anoSel = (state.dashAno && fluxo.porAno[state.dashAno]) ? state.dashAno
    : (fluxo.anos.length ? fluxo.anos[fluxo.anos.length - 1] : anoAtual);
  const mesesSel = MESES.map((nome, i) => {
    const k = anoSel + '-' + String(i + 1).padStart(2, '0');
    const m = fluxo.porMes[k] || { producao:0, faturado:0, custo:0, lucro:0 };
    return { nome, producao:m.producao, faturado:m.faturado, custo:m.custo, lucro:m.lucro };
  });
  const maxMes = Math.max(1, ...mesesSel.map(m => Math.max(m.producao, m.faturado, m.custo)));
  const anoTot = fluxo.porAno[anoSel] || { producao:0, faturado:0, custo:0, lucro:0 };
  const dash = {
    hasData: fluxo.anos.length > 0,
    anoSel,
    anosTabs: (fluxo.anos.length ? fluxo.anos : [anoAtual]).map(a => {
      const active = a === anoSel;
      return { label:a, onClick:() => on.setDashAno(a),
        style:{ padding:'6px 14px', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:active?600:500, fontFamily:"'IBM Plex Sans',sans-serif",
          border:'1px solid '+(active?'#16273d':'#dce1ea'), background:active?'#16273d':'#fff', color:active?'#fff':'#56627a' } };
    }),
    producaoAnoFmt:E0(anoTot.producao), fatAnoFmt:E0(anoTot.faturado), custoAnoFmt:E0(anoTot.custo), lucroAnoFmt:E0(anoTot.lucro),
    lucroAnoStyle:{ fontFamily:"'IBM Plex Mono',monospace", fontVariantNumeric:'tabular-nums', fontWeight:600, fontSize:'22px', color:anoTot.lucro >= 0 ? '#12895e' : '#cf4b3a' },
    maxFmt:E0(maxMes),
    meses: mesesSel.map(m => ({
      nome:m.nome, producaoFmt:m.producao > 0 ? E0(m.producao) : '', fatFmt:m.faturado > 0 ? E0(m.faturado) : '', custoFmt:m.custo > 0 ? E0(m.custo) : '', lucroFmt:E0(m.lucro),
      vazio: m.producao <= 0 && m.faturado <= 0 && m.custo <= 0,
      producaoBarStyle:{ flex:1, height:(m.producao / maxMes * 100).toFixed(1)+'%', minHeight:m.producao > 0 ? '3px' : '0', background:ACC, borderRadius:'3px 3px 0 0' },
      fatBarStyle:{ flex:1, height:(m.faturado / maxMes * 100).toFixed(1)+'%', minHeight:m.faturado > 0 ? '3px' : '0', background:'#12895e', borderRadius:'3px 3px 0 0' },
      custoBarStyle:{ flex:1, height:(m.custo / maxMes * 100).toFixed(1)+'%', minHeight:m.custo > 0 ? '3px' : '0', background:'#aeb8c8', borderRadius:'3px 3px 0 0' },
    })),
    anosResumo: fluxo.anos.map(a => { const y = fluxo.porAno[a];
      return { ano:a, producaoFmt:E0(y.producao), fatFmt:E0(y.faturado), custoFmt:E0(y.custo), lucroFmt:E0(y.lucro),
        active:a === anoSel, onClick:() => on.setDashAno(a),
        rowStyle:{ display:'grid', gridTemplateColumns:'52px 1fr 1fr 1fr 1fr', alignItems:'baseline', gap:'8px', padding:'9px 12px', borderRadius:'8px', cursor:'pointer', background:a === anoSel ? '#f2f6ff' : 'transparent' },
        lucroStyle:{ fontFamily:"'IBM Plex Mono',monospace", fontVariantNumeric:'tabular-nums', fontWeight:600, fontSize:'13px', textAlign:'right', color:y.lucro >= 0 ? '#12895e' : '#cf4b3a' } };
    }),
  };

  // ---- KPIs ----
  const kpis = {
    nObras:obras.length,
    nAtivas:obras.filter(o => o.estado === 'Em execução').length,
    nConcluidas:obras.filter(o => o.estado === 'Concluída').length,
    nPropostas:t.propostas.length,
    valorTotalFmt:E0(t.vT), custoTotalFmt:E0(t.cT), lucroTotalFmt:E0(t.lT),
    margemMediaFmt:P(t.mM), faturadoTotalFmt:E0(t.fT), saldoTotalFmt:E0(t.sT),
    faturadoPctFmt:P(t.vT ? t.fT/t.vT : 0),
    pipelineValorFmt:E0(t.pV), pipelineLucroFmt:E0(t.pL),
    lucroValStyle:theme.numStyle(t.lT >= 0 ? '#12895e' : '#cf4b3a', '25px'),
    margemValStyle:theme.numStyle(theme.margemCor(t.mM), '25px'),
    fatBarStyle:{ width:(t.vT ? t.fT/t.vT*100 : 0).toFixed(1)+'%', height:'100%', background:ACC, borderRadius:'999px' },
  };

  // ---- Gráfico em anel (donut): panorama geral OU repartição por mês ----
  const PIE_PAL = ['#2f6fed','#12895e','#c77d1a','#7a5af5','#d5527f','#1d9ec9','#4d6a92','#b3543e','#5a8f3d','#946bd6','#2aa198','#8a94a6'];
  const pieTabStyle = (active) => ({ padding:'5px 12px', borderRadius:'7px', cursor:'pointer', fontSize:'12px', fontWeight:active?600:500, fontFamily:"'IBM Plex Sans',sans-serif",
    border:'1px solid '+(active?'#16273d':'#dce1ea'), background:active?'#16273d':'#fff', color:active?'#fff':'#56627a' });
  let fatRealTot = 0; t.won.forEach(o => { fatRealTot += faturadoReal(o, state); });
  const pieModo = state.pieModo === 'mes' ? 'mes' : 'geral';
  const pieMesSel = (pieModo === 'mes' && state.pieMes != null) ? state.pieMes : null; // índice 0-11 do mês escolhido
  let pieDefs, pieCentroFmt, pieCentroLabel, pieSubtitle;
  if(pieModo === 'mes' && pieMesSel != null){
    // Detalhe de UM mês: valor de obra disponível (carteira − produção acumulada),
    // produção, faturado e custos desse mês.
    const m = mesesSel[pieMesSel];
    const kSel = anoSel + '-' + String(pieMesSel + 1).padStart(2, '0');
    let cumProd = 0;
    Object.keys(fluxo.porMes).forEach(k => { if(k <= kSel) cumProd += fluxo.porMes[k].producao; });
    const disp = Math.max(0, Math.round((t.vT - cumProd) * 100) / 100);
    pieDefs = [
      ['Valor de obra disponível', disp, '#16273d'],
      ['Produção', m.producao, ACC],
      ['Faturado', m.faturado, '#12895e'],
      ['Custos', m.custo, '#aeb8c8'],
    ];
    pieCentroFmt = E0(m.producao); pieCentroLabel = 'produção ' + m.nome + ' ' + anoSel;
    pieSubtitle = 'Disponível na carteira, produção, faturado e custos · ' + m.nome + ' ' + anoSel;
  } else if(pieModo === 'mes'){
    pieDefs = mesesSel.map((m, i) => [m.nome + ' ' + anoSel, m.producao, PIE_PAL[i % PIE_PAL.length]]).filter(d => d[1] > 0);
    pieCentroFmt = E0(anoTot.producao); pieCentroLabel = 'produção ' + anoSel;
    pieSubtitle = 'Produção mensal (autos de medição) · ano ' + anoSel + ' — escolha um mês para o detalhe';
  } else {
    pieDefs = [
      ['Valor total das obras', t.vT, '#16273d'],
      ['Produção', t.pT, ACC],
      ['Faturado', fatRealTot, '#12895e'],
      ['Custos', t.cT, '#aeb8c8'],
    ];
    pieCentroFmt = E0(t.vT); pieCentroLabel = 'valor da carteira';
    pieSubtitle = 'Valor total das obras, produção, faturado e custos';
  }
  const pieSum = pieDefs.reduce((s, d) => s + d[1], 0) || 1;
  let cum = 0; const parts = [];
  const pieLegend = pieDefs.map(([label, val, color]) => {
    const frac = val / pieSum; const a0 = cum * 360, a1 = (cum + frac) * 360;
    parts.push(color + ' ' + a0.toFixed(2) + 'deg ' + a1.toFixed(2) + 'deg'); cum += frac;
    return { label, valueFmt:E0(val), pctFmt:P(frac), swatchStyle:{ width:'11px', height:'11px', borderRadius:'3px', background:color, flex:'none' } };
  });
  const pie = {
    ringStyle:{ width:'176px', height:'176px', borderRadius:'50%', background:pieDefs.length ? 'conic-gradient(' + parts.join(',') + ')' : '#eef1f5', flex:'none' },
    legend:pieLegend, valorTotalFmt:E0(t.vT), nObras:t.won.length,
    centroFmt: pieCentroFmt,
    centroLabel: pieCentroLabel,
    subtitle: pieSubtitle,
    tabs: [
      { label:'Geral', onClick:() => on.setPieModo('geral'), style:pieTabStyle(pieModo === 'geral') },
      { label:'Por mês', onClick:() => on.setPieModo('mes'), style:pieTabStyle(pieModo === 'mes') },
    ],
    temMeses: pieModo === 'mes',
    mesesTabs: pieModo === 'mes'
      ? [{ label:'Todos', onClick:() => on.setPieMes(null), style:pieTabStyle(pieMesSel == null) }]
        .concat(MESES.map((nome, i) => ({ label:nome, onClick:() => on.setPieMes(i), style:pieTabStyle(pieMesSel === i) })))
      : [],
  };
  // ---- Chips de filtro por estado ----
  const estados = ['Todas', 'Em execução', 'Concluída', 'Adjudicada', 'Em orçamento'];
  const chips = estados.map(s => {
    const active = state.filtro === s;
    const count = s === 'Todas' ? obras.length : obras.filter(o => o.estado === s).length;
    return {
      label:s, count, onClick:() => on.setFiltro(s),
      style:{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'7px 13px', borderRadius:'8px', cursor:'pointer',
        border:'1px solid '+(active?'#16273d':'#dce1ea'), background:active?'#16273d':'#fff', color:active?'#fff':'#56627a',
        fontSize:'13px', fontWeight:active?600:500, fontFamily:"'IBM Plex Sans',sans-serif" },
      countStyle:{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', fontWeight:600, padding:'1px 6px', borderRadius:'5px',
        background:active?'rgba(255,255,255,.18)':'#eef1f5', color:active?'#fff':'#8a94a6' },
    };
  });

  // ---- Tabela: filtro + ordenação ----
  const filt = state.filtro === 'Todas' ? obras.slice() : obras.filter(o => o.estado === state.filtro);
  const key = state.sortKey, dir = state.sortDir;
  const valOf = (o) => { const c = calc(o, state);
    switch(key){
      case 'codigo':   return o.codigo;
      case 'titulo':   return o.titulo.toLowerCase();
      case 'cliente':  return o.cliente.toLowerCase();
      case 'estado':   return o.estado;
      case 'valorObra':return c.valorObra;
      case 'producao': return c.producao;
      case 'faturadoReal': return faturadoReal(o, state);
      case 'custo':    return c.custo;
      case 'lucro':    return c.lucro;
      case 'margem':   return c.margem;
      case 'pctFat':   return c.pctFat;
      default:         return o.codigo;
    }
  };
  filt.sort((a,b) => { const x = valOf(a), y = valOf(b); const r = (typeof x === 'string') ? x.localeCompare(y,'pt') : (x-y); return dir === 'asc' ? r : -r; });

  const rows = filt.map(o => { const c = calc(o, state); const low = realLow && c.margem < 0.08;
    const fatReal = faturadoReal(o, state);
    return {
      codigo:o.codigo, titulo:o.titulo, cliente:o.cliente, estado:o.estado,
      rowStyle:{ display:'grid', gridTemplateColumns:GRID, alignItems:'center', padding:compact?'9px 0':'13px 0', borderTop:'1px solid #eef1f5', cursor:'pointer', background:low?'#fdf4f2':'#fff' },
      estadoStyle:{ display:'inline-flex', alignItems:'center', padding:'3px 9px', borderRadius:'6px', fontSize:'12px', fontWeight:600, color:theme.estadoCor(o.estado), background:theme.estadoTint(o.estado), whiteSpace:'nowrap' },
      producaoFmt:E0(c.producao), custoFmt:E0(c.custo), lucroFmt:E0(c.lucro),
      faturadoRealFmt:E0(fatReal),
      faturadoRealStyle:{ fontFamily:"'IBM Plex Mono',monospace", fontVariantNumeric:'tabular-nums', fontWeight:600, fontSize:'13px', color:fatReal > 0 ? '#12895e' : '#b7bfca' },
      lucroStyle:{ fontFamily:"'IBM Plex Mono',monospace", fontVariantNumeric:'tabular-nums', fontWeight:600, fontSize:'13px', color:c.lucro >= 0 ? '#12895e' : '#cf4b3a' },
      margemFmt:P(c.margem),
      margemStyle:{ fontFamily:"'IBM Plex Mono',monospace", fontVariantNumeric:'tabular-nums', fontWeight:600, fontSize:'13px', color:theme.margemCor(c.margem) },
      onOpen:() => on.open(o.codigo),
      onDelete:(e) => { if(e && e.stopPropagation) e.stopPropagation(); on.deleteObra(o.codigo); },
    };
  });

  const colDefs = [['codigo','Código','left'],['titulo','Obra','left'],['cliente','Cliente','left'],['estado','Estado','left'],
    ['producao','Produção','right'],['faturadoReal','Faturado','right'],['custo','Custos','right'],['lucro','Lucro','right'],['margem','Margem','right']];
  const cols = colDefs.map(([k,label,align]) => { const active = state.sortKey === k;
    return {
      label, onClick:() => on.sort(k), arrow:active ? (state.sortDir === 'asc' ? ' ↑' : ' ↓') : '',
      thStyle:{ textAlign:align, padding:'0 16px', cursor:'pointer', userSelect:'none', background:'none', border:'none', width:'100%',
        color:active?'#16273d':'#8a94a6', fontSize:'11px', fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase', fontFamily:"'IBM Plex Sans',sans-serif", whiteSpace:'nowrap' },
    };
  });

  // ---- Gráfico: barras valor/custo/lucro + marca de faturado ----
  const chartObras = obras.map(o => ({ o, c: calc(o, state) })).sort((a,b) => b.c.valorObra - a.c.valorObra);
  const maxV = Math.max(1, ...chartObras.map(x => x.c.valorObra));
  const chartRows = chartObras.map(({ o, c }) => {
    const vp = c.valorObra/maxV*100;
    const cf = c.valorObra ? Math.max(0, Math.min(1, c.custo/c.valorObra)) : 0;
    const pr = o.estado === 'Em orçamento';
    return {
      codigo:o.codigo, titulo:o.titulo, onOpen:() => on.open(o.codigo),
      dotStyle:{ width:'8px', height:'8px', borderRadius:'2px', background:theme.estadoCor(o.estado), flex:'none' },
      valorFmt:E0(c.valorObra), margemFmt:P(c.margem),
      margemStyle:{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:600, color:theme.margemCor(c.margem), fontSize:'12px' },
      innerStyle:{ width:vp.toFixed(1)+'%', height:'100%', display:'flex', borderRadius:'5px', overflow:'hidden', opacity:pr?0.5:1, outline:pr?'1px dashed #b9c2d0':'none', outlineOffset:'-1px' },
      custoSegStyle:{ width:(cf*100).toFixed(1)+'%', background:'#aeb8c8', height:'100%', flex:'none' },
      lucroSegStyle:{ flex:'1', minWidth:'0', background:c.lucro >= 0 ? '#12895e' : '#cf4b3a', height:'100%' },
      markStyle:{ position:'absolute', top:'-3px', bottom:'-3px', left:(c.pctFat*vp).toFixed(1)+'%', width:'2px', background:'#16273d', borderRadius:'1px', display:c.faturado > 0 ? 'block' : 'none' },
    };
  });
  const chart = { maxFmt:E0(maxV), rows:chartRows };

  const podeEditar = !!opts.podeEditar;
  const podeApagarObra = !!opts.podeApagarObra;
  return { kpis, pie, chips, rows, cols, chart, dash, podeEditar, podeApagarObra, soLeitura:!podeEditar, onNovaObra:() => on.novaObra() };
}
