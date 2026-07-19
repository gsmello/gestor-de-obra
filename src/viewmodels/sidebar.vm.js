// ============================================================
// viewmodels/sidebar.vm.js — VIEW-MODEL da navegação lateral
// Transforma a lista de obras + estado em props prontas para Sidebar.dc.html.
// Recebe: (obras, state, opts, on). Devolve objeto consumido pelo template.
//   opts = { ACC, compact, realLow }
//   on   = handlers do SHELL (open, goCarteira)
// ============================================================
import * as theme from '../core/theme.js';
import * as auth from '../core/auth.js';
import { autosFaturaveis, adjudDe, aprovDe, adjudFatEstado, ADJ_KEY } from '../core/calc.js';

export function buildSidebar(obras, state, opts, on){
  const ACC = opts.ACC;
  const s = state.sessao;

  const navObras = obras.map(o => {
    const active = state.view === 'obra' && state.selectedId === o.codigo;
    return {
      codigo:o.codigo, titulo:o.titulo, onClick:() => on.open(o.codigo),
      dotStyle:{ width:'7px', height:'7px', borderRadius:'2px', background:theme.estadoCor(o.estado), flex:'none' },
      style:{ display:'flex', alignItems:'center', gap:'9px', padding:'8px 10px', borderRadius:'7px', cursor:'pointer', background:active?'rgba(255,255,255,.10)':'transparent' },
      tituloStyle:{ fontSize:'12.5px', color:active?'#fff':'#9fb0c6', fontWeight:active?600:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
      codigoStyle:{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10.5px', color:active?'#cdd9ea':'#6f819b' },
    };
  });

  const carteiraNavStyle = { display:'flex', alignItems:'center', gap:'10px', padding:'9px 11px', borderRadius:'8px', cursor:'pointer',
    background:state.view==='carteira'?ACC:'transparent', color:state.view==='carteira'?'#fff':'#9fb0c6', fontSize:'13.5px', fontWeight:600 };

  // ---- Faturação (admin + gestor) — só conta itens APROVADOS por emitir ----
  const podeFat = auth.podeFaturar(s);
  let pend = 0;
  if(podeFat) obras.forEach(o => {
    autosFaturaveis(o, state).forEach(a => { if(a.total > 0 && a.aprov === 'aprovado' && !a.faturado) pend++; });
    const adj = adjudDe(o, state);
    if(adj > 0 && aprovDe(o, state, ADJ_KEY) === 'aprovado' && adjudFatEstado(o, state) !== 'faturado') pend++;
  });
  const fatAtivo = state.view === 'faturacao';
  const fatNav = podeFat ? {
    count:pend, temPend:pend > 0,
    onClick:() => on.goFaturacao(),
    style:{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 11px', borderRadius:'8px', cursor:'pointer',
      background:fatAtivo ? ACC : 'transparent', color:fatAtivo ? '#fff' : '#9fb0c6', fontSize:'13.5px', fontWeight:600 },
    countStyle:{ marginLeft:'auto', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', fontWeight:600, padding:'1px 7px', borderRadius:'6px',
      background:fatAtivo ? 'rgba(255,255,255,.22)' : '#c77d1a', color:'#fff' },
  } : null;

  // ---- Aprovação (só admin) — conta itens pendentes de decisão ----
  const podeApr = auth.podeAprovar(s);
  let pendApr = 0;
  if(podeApr) obras.forEach(o => {
    autosFaturaveis(o, state).forEach(a => { if(a.total > 0 && a.aprov === 'pendente') pendApr++; });
    const adj = adjudDe(o, state);
    if(adj > 0 && aprovDe(o, state, ADJ_KEY) === 'pendente') pendApr++;
  });
  const aprAtivo = state.view === 'aprovacao';
  const aprovNav = podeApr ? {
    count:pendApr, temPend:pendApr > 0,
    onClick:() => on.goAprovacao(),
    style:{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 11px', borderRadius:'8px', cursor:'pointer',
      background:aprAtivo ? ACC : 'transparent', color:aprAtivo ? '#fff' : '#9fb0c6', fontSize:'13.5px', fontWeight:600 },
    countStyle:{ marginLeft:'auto', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', fontWeight:600, padding:'1px 7px', borderRadius:'6px',
      background:aprAtivo ? 'rgba(255,255,255,.22)' : '#c77d1a', color:'#fff' },
  } : null;

  const brandStyle = { width:'34px', height:'34px', borderRadius:'9px', background:ACC, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
    fontFamily:"'IBM Plex Mono',monospace", fontWeight:600, fontSize:'13px', flex:'none' };

  // ---- Utilizador com sessão iniciada (rodapé) ----
  const admin = auth.podeEditar(s);
  const utilizador = s ? {
    nome:s.nome, papelLabel:auth.papelLabel(s.papel), iniciais:auth.iniciais(s.nome),
    avatarStyle:{ width:'32px', height:'32px', borderRadius:'9px', flex:'none', display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:"'IBM Plex Mono',monospace", fontWeight:600, fontSize:'12px', background:admin ? ACC : '#31445f', color:'#fff' },
    nomeStyle:{ fontSize:'13px', fontWeight:600, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
    papelStyle:{ fontSize:'10.5px', fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase', color:admin ? '#8fb4ff' : '#7e90ac', fontFamily:"'IBM Plex Sans',sans-serif" },
    onSair:() => on.sair(),
  } : null;

  return { navObras, carteiraNavStyle, brandStyle, utilizador, fatNav, temFatNav:!!fatNav, aprovNav, temAprovNav:!!aprovNav, onGoCarteira:() => on.goCarteira() };
}
