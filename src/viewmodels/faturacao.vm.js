// ============================================================
// viewmodels/faturacao.vm.js — VIEW-MODEL do separador FATURAÇÃO (só admin)
// Junta TODOS os autos de TODAS as obras e o seu estado de faturação.
// Fluxo: pendente → PROFORMA → FATURADO. O utilizador cria o auto; aqui o
// admin emite a proforma e depois transforma-a em fatura.
// Recebe: (obras, state, opts, on).
//   state.fatFiltro = 'todos' | 'pendentes' | 'proforma' | 'faturados'
//   on = { proformarAuto, faturarAuto, anularAuto, setFatFiltro, open }
// ============================================================
import * as fmt from '../core/format.js';
import * as theme from '../core/theme.js';
import { autosFaturaveis, adjudDe, adjudFatEstado, fatDatas, fatCodigos, aprovDe, ADJ_KEY } from '../core/calc.js';

export function buildFaturacao(obras, state, opts, on){
  const ACC = (opts && opts.ACC) || '#2f6fed';
  const E = fmt.EUR, E0 = fmt.EUR0;
  const filtro = ['todos', 'pendentes', 'proforma', 'faturados'].includes(state.fatFiltro) ? state.fatFiltro : 'todos';

  // Achata todos os itens faturáveis de todas as obras: a ADJUDICAÇÃO (uma por
  // obra) + os autos de medição. A adjudicação segue o mesmo fluxo dos autos
  // (pendente → proforma → faturado); ao ser FATURADA, fica bloqueada na obra.
  const todas = [];
  obras.forEach(o => {
    const adj = adjudDe(o, state);
    if(adj > 0){
      const ef = adjudFatEstado(o, state);
      const d = fatDatas(o, state, ADJ_KEY);
      const cc = fatCodigos(o, state, ADJ_KEY);
      todas.push({ key:ADJ_KEY, n:0, ehAdjud:true, data:o.inicio, total:adj, estadoFat:ef, faturado:ef === 'faturado', dataFatura:d.dataFatura, codProforma:cc.codProforma, codFatura:cc.codFatura, aprov:aprovDe(o, state, ADJ_KEY), obraCodigo:o.codigo, obraTitulo:o.titulo, obraEstado:o.estado });
    }
    autosFaturaveis(o, state).forEach(a => {
      if(!(a.total > 0)) return;
      todas.push(Object.assign({}, a, { ehAdjud:false, obraCodigo:o.codigo, obraTitulo:o.titulo, obraEstado:o.estado }));
    });
  });
  // Só aparecem na Faturação os itens APROVADOS pelo admin.
  const aprovados = todas.filter(a => a.aprov === 'aprovado');
  // Ordem: por estado (pendente → proforma → faturado); dentro de cada estado,
  // agrupa por obra e mostra a adjudicação antes dos seus autos.
  const ordem = { pendente:0, proforma:1, faturado:2 };
  aprovados.sort((a, b) => (ordem[a.estadoFat] - ordem[b.estadoFat])
    || String(a.obraCodigo).localeCompare(String(b.obraCodigo))
    || (Number(b.ehAdjud) - Number(a.ehAdjud))
    || String(b.data || '').localeCompare(String(a.data || '')));

  const pendentes = aprovados.filter(a => a.estadoFat === 'pendente');
  const proformas = aprovados.filter(a => a.estadoFat === 'proforma');
  const faturados = aprovados.filter(a => a.estadoFat === 'faturado');
  const valPend = pendentes.reduce((s, a) => s + a.total, 0);
  const valPro  = proformas.reduce((s, a) => s + a.total, 0);
  const valFat  = faturados.reduce((s, a) => s + a.total, 0);

  const visiveis = filtro === 'pendentes' ? pendentes : filtro === 'proforma' ? proformas : filtro === 'faturados' ? faturados : aprovados;

  const defs = [['todos', 'Todos', aprovados.length], ['pendentes', 'Por emitir', pendentes.length], ['proforma', 'Proforma', proformas.length], ['faturados', 'Faturados', faturados.length]];
  const chips = defs.map(([k, label, count]) => {
    const active = filtro === k;
    return {
      label, count, onClick:() => on.setFatFiltro(k),
      style:{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'8px 15px', borderRadius:'9px', cursor:'pointer',
        border:'1px solid ' + (active ? '#16273d' : '#dce1ea'), background:active ? '#16273d' : '#fff', color:active ? '#fff' : '#56627a',
        fontSize:'13px', fontWeight:active ? 600 : 500, fontFamily:"'IBM Plex Sans',sans-serif" },
      countStyle:{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11.5px', fontWeight:600, padding:'1px 7px', borderRadius:'6px',
        background:active ? 'rgba(255,255,255,.18)' : '#eef1f5', color:active ? '#fff' : '#8a94a6' },
    };
  });

  // Cor / tint / rótulo do estado de faturação.
  const estMeta = {
    pendente: { cor:'#c77d1a', tint:'#f7eddb', label:'Por emitir' },
    proforma: { cor:ACC,       tint:'#eaf0fe', label:'Proforma' },
    faturado: { cor:'#12895e', tint:'#e4f3ec', label:'Faturado' },
  };

  const rows = visiveis.map(a => {
    const m = estMeta[a.estadoFat] || estMeta.pendente;
    const cod = a.estadoFat === 'faturado' ? (a.codFatura || '') : a.estadoFat === 'proforma' ? (a.codProforma || '') : '';
    return {
      obraCodigo:a.obraCodigo, obraTitulo:a.obraTitulo, nLabel:a.ehAdjud ? 'Adjud.' : ('Auto ' + a.n), ehAdjud:!!a.ehAdjud,
      dataFmt:fmt.fmtDate(a.data), dataFatFmt:a.dataFatura ? fmt.fmtDate(a.dataFatura) : '—', valorFmt:E(a.total),
      codFmt: cod || '—', temCod: !!cod,
      codStyle:{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12.5px', fontWeight:cod ? 600 : 400, color: cod ? '#16273d' : '#c0c8d2' },
      estadoFat:a.estadoFat, ehPendente:a.estadoFat === 'pendente', ehProforma:a.estadoFat === 'proforma', ehFaturado:a.estadoFat === 'faturado',
      dotStyle:{ width:'8px', height:'8px', borderRadius:'2px', background:theme.estadoCor(a.obraEstado), flex:'none' },
      autoBadgeStyle:{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'3px 9px', borderRadius:'7px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', fontWeight:600,
        color:a.ehAdjud ? ACC : '#16273d', background:a.ehAdjud ? '#eaf0fe' : '#eef1f5', whiteSpace:'nowrap' },
      statusStyle:{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'4px 11px', borderRadius:'7px', fontSize:'12px', fontWeight:600, color:m.cor, background:m.tint, whiteSpace:'nowrap' },
      statusLabel:m.label,
      proformaBtnStyle:{ display:'inline-flex', alignItems:'center', gap:'6px', border:'1px solid ' + ACC, background:'#fff', color:ACC, fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'12.5px', fontWeight:600, padding:'7px 13px', borderRadius:'8px', cursor:'pointer', whiteSpace:'nowrap' },
      faturarBtnStyle:{ display:'inline-flex', alignItems:'center', gap:'6px', border:'none', background:'#12895e', color:'#fff', fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'12.5px', fontWeight:600, padding:'8px 14px', borderRadius:'8px', cursor:'pointer', whiteSpace:'nowrap' },
      anularBtnStyle:{ border:'1px solid #d3dae4', background:'#fff', color:'#8a94a6', fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'12.5px', fontWeight:600, padding:'7px 12px', borderRadius:'8px', cursor:'pointer', whiteSpace:'nowrap' },
      onVerObra:() => on.open(a.obraCodigo),
      onProforma:() => on.proformarAuto(a.obraCodigo, a.key),
      onFaturar:() => on.faturarAuto(a.obraCodigo, a.key),
      onAnular:() => on.anularAuto(a.obraCodigo, a.key),
    };
  });

  return {
    kpis:{
      nTotal:aprovados.length, nPend:pendentes.length, nPro:proformas.length, nFat:faturados.length,
      valPendFmt:E0(valPend), valProFmt:E0(valPro), valFatFmt:E0(valFat),
    },
    chips, filtro, rows,
    temRows:visiveis.length > 0, semRows:visiveis.length === 0,
    vazioMsg: filtro === 'pendentes' ? 'Não há autos aprovados por emitir.'
            : filtro === 'proforma' ? 'Não há proformas por transformar em fatura.'
            : filtro === 'faturados' ? 'Ainda não faturou nenhum auto.'
            : 'Ainda não há autos aprovados para faturar.',
  };
}
