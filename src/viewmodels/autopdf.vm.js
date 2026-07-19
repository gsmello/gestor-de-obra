// ============================================================
// viewmodels/autopdf.vm.js — VIEW-MODEL da FOLHA DO AUTO (para PDF)
// Monta a folha imprimível de UM auto: cabeçalho da obra + TODOS os artigos
// do mapa de trabalhos com a quantidade medida NESTE auto (preenchida) e o
// respetivo total, mais o desdobramento (orçamento, dedução, a faturar).
// Recebe: (obras, state, opts, on). Devolve null se não há auto a imprimir.
//   state.printAuto = { obraId, idx }  (idx = posição na lista de autos)
//   on = { imprimirPDF, fecharPDF }
// ============================================================
import * as fmt from '../core/format.js';
import { orcamentoDe, adjudPctDe, autoValores, autosDe } from '../core/calc.js';

export function buildAutoFolha(obras, state, opts, on){
  const p = state.printAuto;
  if(!p) return null;
  const obra = obras.find(o => o.codigo === p.obraId);
  if(!obra) return null;

  const orc = orcamentoDe(obra, state);
  const pct = adjudPctDe(obra, state);
  const auto = autosDe(obra, state)[p.idx];
  if(!auto) return null;

  const E = fmt.EUR, N3 = fmt.N3, P = fmt.PCT1;
  const qa = auto.qtds || {}, qe = auto.qtdsExtra || {};
  // Os autos semente indexam por _k; os do utilizador por id. _k === id no
  // mapa de trabalhos, por isso aceitamos qualquer um dos dois.
  const qtDe = (it, map) => parseFloat((map[it._k] != null ? map[it._k] : map[it.id]) || 0) || 0;

  // Acumulado dos AUTOS ANTERIORES (índices < idx): quantidade já medida por _k
  // (artigos + trabalhos a mais). Alimenta a coluna "Acum. ant.".
  const autosAnt = autosDe(obra, state).slice(0, p.idx);
  const prevQ = {};
  autosAnt.forEach(a => {
    Object.entries(a.qtds || {}).forEach(([k,q]) => { prevQ[k] = (prevQ[k]||0) + (parseFloat(q)||0); });
    Object.entries(a.qtdsExtra || {}).forEach(([k,q]) => { prevQ[k] = (prevQ[k]||0) + (parseFloat(q)||0); });
  });
  const acumDe = (it) => (prevQ[it._k] != null ? prevQ[it._k] : (prevQ[it.id] || 0)) || 0;

  const linha = (it) => {
    // Título de divisão: faixa organizadora, sem colunas numéricas.
    if(it._sec) return { ehSec:true, ehItem:false, titulo: it.titulo || '' };
    const map = it._lista === 'extra' ? qe : qa;
    const q = qtDe(it, map); const tot = q * (it.vunit || 0);
    const medido = q > 0.0001;
    const acum = acumDe(it);
    return {
      ehSec:false, ehItem:true,
      id: it.id || '', desc: it.desc, uni: it.uni,
      qtContratoFmt: N3(it.qt || 0), qtAcumFmt: acum > 0.0001 ? N3(acum) : '—', qtAutoFmt: medido ? N3(q) : '—',
      vunitFmt: E(it.vunit || 0), totalFmt: medido ? E(tot) : '—',
      rowStyle: { display:'grid', gridTemplateColumns:'48px minmax(0,1fr) 30px 58px 60px 60px 66px 80px', alignItems:'center', borderTop:'1px solid #eef1f5', background: medido ? '#eaf3ff' : '#fff' },
      idStyle: { padding:'8px 8px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#56627a' },
      descStyle: { padding:'8px 8px', fontSize:'11.5px', color:'#16202e', lineHeight:'1.35' },
      uniStyle: { padding:'8px 4px', fontSize:'11px', color:'#8a94a6', textAlign:'center', fontFamily:"'IBM Plex Mono',monospace" },
      numMuted: { padding:'8px 7px', fontFamily:"'IBM Plex Mono',monospace", fontVariantNumeric:'tabular-nums', fontSize:'11px', color:'#8a94a6', textAlign:'right' },
      numAcum: { padding:'8px 7px', fontFamily:"'IBM Plex Mono',monospace", fontVariantNumeric:'tabular-nums', fontSize:'11px', color: acum > 0.0001 ? '#56627a' : '#c0c8d2', textAlign:'right' },
      numAuto: { padding:'8px 7px', fontFamily:"'IBM Plex Mono',monospace", fontVariantNumeric:'tabular-nums', fontSize:'11.5px', fontWeight: medido ? 700 : 400, color: medido ? '#1e4db7' : '#c0c8d2', textAlign:'right' },
      numTotal: { padding:'8px 7px', fontFamily:"'IBM Plex Mono',monospace", fontVariantNumeric:'tabular-nums', fontSize:'11.5px', fontWeight:600, color: medido ? '#16202e' : '#c0c8d2', textAlign:'right' },
    };
  };

  const artigos = orc.artigos.map(it => linha(Object.assign({ _lista:'artigos' }, it)));
  const extra = orc.extra.map(it => linha(Object.assign({ _lista:'extra' }, it)));
  const v = autoValores(orc, pct, auto);

  // Faturado ACUMULADO dos autos anteriores (artigos com dedução de adjudicação;
  // trabalhos a mais SEM dedução — não têm adjudicação).
  const r2 = x => Math.round(x * 100) / 100;
  let prevOrc = 0, prevExtra = 0;
  autosAnt.forEach(a => { const pv = autoValores(orc, pct, a); prevOrc += pv.autoOrc; prevExtra += pv.autoExtra; });
  const prevFat = r2(prevOrc * (1 - pct) + prevExtra);
  const acumFat = r2(prevFat + v.total);
  const hasAcum = p.idx > 0;

  // Totais (linhas do resumo, estilo recibo).
  const resumo = [
    { label:'Faturado acumulado (autos anteriores)', valFmt:E(prevFat), show: hasAcum, accent:true },
    { label:'Orçamento medido neste auto', valFmt:E(v.autoOrc), show:true },
    { label:'Dedução de adjudicação ('+P(pct)+')', valFmt:E(v.deducao), show: pct > 0, neg:true },
    { label:'A faturar (após dedução)', valFmt:E(v.aFacturar), show: pct > 0 },
    { label:'Trabalhos a mais (sem adjudicação)', valFmt:E(v.autoExtra), show: v.autoExtra > 0.001, pos:true },
  ].filter(r => r.show).map(r => ({
    label:r.label, valFmt:r.valFmt,
    rowStyle:{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'6px 0', borderBottom: r.accent ? '1px dashed #d9dee7' : 'none', marginBottom: r.accent ? '4px' : '0' },
    labelStyle:{ fontSize:'12px', color: r.accent ? '#16273d' : '#56627a', fontWeight: r.accent ? 600 : 400 },
    valStyle:{ fontFamily:"'IBM Plex Mono',monospace", fontVariantNumeric:'tabular-nums', fontSize:'12.5px', fontWeight: r.accent ? 600 : 500, color: r.neg ? '#cf4b3a' : (r.pos ? '#12895e' : '#16202e') },
  }));

  return {
    obraCode: obra.codigo, obraTitulo: obra.titulo, cliente: obra.cliente, local: obra.local || '—',
    autoN: 'Auto ' + (p.idx + 1), dataFmt: fmt.fmtDate(auto.data),
    emissaoFmt: fmt.fmtDate(new Date().toISOString().slice(0, 10)),
    artigos, extra, hasExtra: orc.extra.length > 0,
    resumo, totalFmt: E(v.total),
    hasAcum, acumFatFmt: E(acumFat),
    onPrint: () => on.imprimirPDF(), onClose: () => on.fecharPDF(),
  };
}
