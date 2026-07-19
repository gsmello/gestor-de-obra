// ============================================================
// viewmodels/aprovacao.vm.js — VIEW-MODEL do separador APROVAÇÃO (só admin)
// Junta TODOS os itens ENVIADOS para aprovação (autos + adjudicação) de todas
// as obras. Fluxo: rascunho → pendente → aprovado | reprovado.
// O admin aprova ou reprova; só depois de APROVADO o item aparece na Faturação.
// Recebe: (obras, state, opts, on).
//   state.aprovFiltro = 'pendentes' | 'aprovados' | 'reprovados' | 'todos'
//   on = { aprovarAuto, reprovarAuto, setAprovFiltro, open }
// ============================================================
import * as fmt from '../core/format.js';
import * as theme from '../core/theme.js';
import { autosFaturaveis, adjudDe, aprovInfo, fatEstado, ADJ_KEY } from '../core/calc.js';

export function buildAprovacao(obras, state, opts, on){
  const ACC = (opts && opts.ACC) || '#2f6fed';
  const E = fmt.EUR, E0 = fmt.EUR0;
  const filtro = ['todos', 'pendentes', 'aprovados', 'reprovados'].includes(state.aprovFiltro) ? state.aprovFiltro : 'pendentes';

  // Reúne os itens que já foram enviados para aprovação (estado ≠ rascunho).
  const todos = [];
  obras.forEach(o => {
    const adj = adjudDe(o, state);
    if(adj > 0){
      const inf = aprovInfo(o, state, ADJ_KEY);
      if(inf.estado !== 'rascunho'){
        todos.push({ key:ADJ_KEY, ehAdjud:true, data:o.inicio, total:adj, aprov:inf.estado, motivo:inf.motivo, dataEnvio:inf.dataEnvio, dataDecisao:inf.dataDecisao,
          faturado: fatEstado(o, state, ADJ_KEY) === 'faturado', obraCodigo:o.codigo, obraTitulo:o.titulo, obraEstado:o.estado });
      }
    }
    autosFaturaveis(o, state).forEach(a => {
      if(!(a.total > 0) || a.aprov === 'rascunho') return;
      const inf = aprovInfo(o, state, a.key);
      todos.push({ key:a.key, n:a.n, ehAdjud:false, data:a.data, total:a.total, aprov:a.aprov, motivo:inf.motivo, dataEnvio:inf.dataEnvio, dataDecisao:inf.dataDecisao,
        faturado:a.faturado, obraCodigo:o.codigo, obraTitulo:o.titulo, obraEstado:o.estado });
    });
  });

  const ordem = { pendente:0, reprovado:1, aprovado:2 };
  todos.sort((a, b) => (ordem[a.aprov] - ordem[b.aprov])
    || String(a.obraCodigo).localeCompare(String(b.obraCodigo))
    || (Number(b.ehAdjud) - Number(a.ehAdjud))
    || String(b.data || '').localeCompare(String(a.data || '')));

  const pendentes = todos.filter(a => a.aprov === 'pendente');
  const aprovados = todos.filter(a => a.aprov === 'aprovado');
  const reprovados = todos.filter(a => a.aprov === 'reprovado');
  const valPend = pendentes.reduce((s, a) => s + a.total, 0);
  const valApr  = aprovados.reduce((s, a) => s + a.total, 0);
  const valRep  = reprovados.reduce((s, a) => s + a.total, 0);

  const visiveis = filtro === 'pendentes' ? pendentes : filtro === 'aprovados' ? aprovados : filtro === 'reprovados' ? reprovados : todos;

  const defs = [['pendentes', 'Pendentes', pendentes.length], ['aprovados', 'Aprovados', aprovados.length], ['reprovados', 'Reprovados', reprovados.length], ['todos', 'Todos', todos.length]];
  const chips = defs.map(([k, label, count]) => {
    const active = filtro === k;
    return {
      label, count, onClick:() => on.setAprovFiltro(k),
      style:{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'8px 15px', borderRadius:'9px', cursor:'pointer',
        border:'1px solid ' + (active ? '#16273d' : '#dce1ea'), background:active ? '#16273d' : '#fff', color:active ? '#fff' : '#56627a',
        fontSize:'13px', fontWeight:active ? 600 : 500, fontFamily:"'IBM Plex Sans',sans-serif" },
      countStyle:{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11.5px', fontWeight:600, padding:'1px 7px', borderRadius:'6px',
        background:active ? 'rgba(255,255,255,.18)' : '#eef1f5', color:active ? '#fff' : '#8a94a6' },
    };
  });

  const estMeta = {
    pendente:  { cor:'#c77d1a', tint:'#f7eddb', label:'Pendente' },
    aprovado:  { cor:'#12895e', tint:'#e4f3ec', label:'Aprovado' },
    reprovado: { cor:'#cf4b3a', tint:'#fdeeec', label:'Reprovado' },
  };

  const btnAprovar = { display:'inline-flex', alignItems:'center', gap:'6px', border:'none', background:'#12895e', color:'#fff', fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'12.5px', fontWeight:600, padding:'8px 15px', borderRadius:'8px', cursor:'pointer', whiteSpace:'nowrap' };
  const btnReprovar = { display:'inline-flex', alignItems:'center', gap:'6px', border:'1px solid #e3b6ae', background:'#fff', color:'#cf4b3a', fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'12.5px', fontWeight:600, padding:'7px 14px', borderRadius:'8px', cursor:'pointer', whiteSpace:'nowrap' };

  const rows = visiveis.map(a => {
    const m = estMeta[a.aprov] || estMeta.pendente;
    // Ações disponíveis por estado (não se mexe num item já faturado).
    const podeAprovar = !a.faturado && (a.aprov === 'pendente' || a.aprov === 'reprovado');
    const podeReprovar = !a.faturado && (a.aprov === 'pendente' || a.aprov === 'aprovado');
    return {
      obraCodigo:a.obraCodigo, obraTitulo:a.obraTitulo, nLabel:a.ehAdjud ? 'Adjud.' : ('Auto ' + a.n), ehAdjud:!!a.ehAdjud,
      dataFmt:fmt.fmtDate(a.data), envioFmt:a.dataEnvio ? fmt.fmtDate(a.dataEnvio) : '—', valorFmt:E(a.total),
      temMotivo: !!a.motivo, motivo:a.motivo || '',
      dotStyle:{ width:'8px', height:'8px', borderRadius:'2px', background:theme.estadoCor(a.obraEstado), flex:'none' },
      autoBadgeStyle:{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'3px 9px', borderRadius:'7px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', fontWeight:600,
        color:a.ehAdjud ? ACC : '#16273d', background:a.ehAdjud ? '#eaf0fe' : '#eef1f5', whiteSpace:'nowrap' },
      statusStyle:{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'4px 11px', borderRadius:'7px', fontSize:'12px', fontWeight:600, color:m.cor, background:m.tint, whiteSpace:'nowrap' },
      statusLabel:m.label,
      faturado:a.faturado,
      podeAprovar, podeReprovar,
      aprovarBtnStyle:btnAprovar, reprovarBtnStyle:btnReprovar,
      onVerObra:() => on.open(a.obraCodigo),
      onAprovar:() => on.aprovarAuto(a.obraCodigo, a.key),
      onReprovar:() => on.reprovarAuto(a.obraCodigo, a.key),
    };
  });

  return {
    kpis:{
      nPend:pendentes.length, nApr:aprovados.length, nRep:reprovados.length,
      valPendFmt:E0(valPend), valAprFmt:E0(valApr), valRepFmt:E0(valRep),
    },
    chips, filtro, rows,
    temRows:visiveis.length > 0, semRows:visiveis.length === 0,
    vazioMsg: filtro === 'pendentes' ? 'Nada por aprovar. Tudo em dia!'
            : filtro === 'aprovados' ? 'Ainda não aprovou nenhum item.'
            : filtro === 'reprovados' ? 'Nenhum item reprovado.'
            : 'Ainda não há itens enviados para aprovação.',
  };
}
