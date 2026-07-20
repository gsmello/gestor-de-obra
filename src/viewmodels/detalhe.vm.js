// ============================================================
// viewmodels/detalhe.vm.js — VIEW-MODEL do ecrã DETALHE DA OBRA
// Produz "sel" (cabeçalho, KPIs, e os separadores) + "tabs".
// Separadores: rentabilidade, orcamento (mapa de trabalhos editável),
//              custos (lançamentos), cf (controlo financeiro), autos.
// Recebe: (obras, state, opts, on). Devolve null se não há obra selecionada.
// ============================================================
import * as fmt from '../core/format.js';
import * as theme from '../core/theme.js';
import * as auth from '../core/auth.js';
import { calc, carteiraTotais, seedAutosVisiveis, autosFaturaveis, aprovInfo, fatDatas, adjudFatEstado, faturadoReal, tncDe, ADJ_KEY, VENDA_CAT } from '../core/calc.js';
import { buildOrcamento } from './orcamento.vm.js';

// Estado de aprovação -> cor / tint / rótulo do chip.
function aprovMeta(estado){
  const m = {
    rascunho:  { cor:'#8a94a6', tint:'#eef1f5', label:'Rascunho' },
    pendente:  { cor:'#c77d1a', tint:'#f7eddb', label:'Em aprovação' },
    aprovado:  { cor:'#12895e', tint:'#e4f3ec', label:'Aprovado' },
    reprovado: { cor:'#cf4b3a', tint:'#fdeeec', label:'Reprovado' },
  };
  return m[estado] || m.rascunho;
}
function chipStyleDe(meta){
  return { display:'inline-flex', alignItems:'center', gap:'5px', padding:'3px 9px', borderRadius:'6px', fontSize:'11.5px', fontWeight:600, whiteSpace:'nowrap', color:meta.cor, background:meta.tint };
}

export function buildDetalhe(obras, state, opts, on){
  const selObra = obras.find(o => o.codigo === state.selectedId);
  if(!selObra) return null;

  const E = fmt.EUR, E0 = fmt.EUR0, P = fmt.PCT1;
  const ACC = opts.ACC;
  const c = calc(selObra, state);
  const valorObra = c.valorObra;
  const { mM } = carteiraTotais(obras, state); // margem média da carteira (comparação)

  // ---- Separadores ----
  const tabRent   = state.detailTab === 'rentabilidade';
  const tabOrc    = state.detailTab === 'orcamento';
  const tabCustos = state.detailTab === 'custos';
  const tabCF     = state.detailTab === 'cf';
  const tabAutos  = state.detailTab === 'autos';
  const tabs = [['rentabilidade','Rentabilidade'],['orcamento','Auto base'],['custos','Custos de obra'],['cf','Controlo financeiro'],['autos','Autos de medição']].map(([k,l]) => {
    const active = state.detailTab === k;
    return { label:l, onClick:() => on.setTab(k),
      style:{ padding:'12px 4px', marginRight:'24px', cursor:'pointer', fontSize:'14px', fontWeight:active?600:500, color:active?'#16273d':'#8a94a6', borderBottom:'2px solid '+(active?ACC:'transparent'), marginBottom:'-1px', transition:'color .12s', whiteSpace:'nowrap' } };
  });

  // ---- Rentabilidade: composição custo/lucro ----
  const custoFrac = valorObra ? Math.max(0, Math.min(1, c.custo/valorObra)) : 0;

  // ---- Controlo financeiro: linhas valor + faturação ----
  const lineRow = (s) => ({ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:s?'13px 0 2px':'9px 0', borderTop:s?'1px solid #e0e5ee':'1px solid #f3f5f8', marginTop:s?'5px':'0' });
  const lblS = (s) => ({ fontSize:s?'14px':'13px', color:s?'#16202e':'#56627a', fontWeight:s?600:400 });
  const valS = (s,color) => ({ fontFamily:"'IBM Plex Mono',monospace", fontVariantNumeric:'tabular-nums', fontWeight:600, fontSize:s?'16px':'13.5px', color:color||'#16202e' });

  const cfValor = [
    { label:'Orçamento (mapa de trabalhos)', valFmt:E(c.orcT), strong:false },
    ...(c.extraT > 0 ? [{ label:'Trabalhos a mais', valFmt:'+ '+E(c.extraT), strong:false, pos:true }] : []),
    { label:'Valor atual da obra', valFmt:E(valorObra), strong:true },
  ].map(l => ({ label:l.label, valFmt:l.valFmt, rowStyle:lineRow(l.strong), labelStyle:lblS(l.strong), valStyle:valS(l.strong, l.pos?'#12895e':(l.neg?'#cf4b3a':null)) }));

  const cfFat = [
    { label:'Adjudicação', sub:'  ·  dedução '+P(c.pct)+' por auto', valFmt:E(c.adjud), strong:false },
    { label:'Faturado em autos', sub:'  ·  '+c.autos.length+' autos', valFmt:E(c.autosTotal), strong:false },
    { label:'Total faturado', sub:'', valFmt:E(c.faturado), strong:true },
    ...(c.fecho && c.acertoAdjud !== 0 ? [
      { label:'Acerto de adjudicação (fecho)', sub:'  ·  trabalho a menos '+E(c.naoExec), valFmt:E(c.acertoAdjud), strong:false, neg:true },
    ] : []),
    ...(c.tncTotal > 0 ? [
      { label:'Trabalho não contabilizado', sub:'  ·  não faturável', valFmt:'+ '+E(c.tncTotal), strong:false, pos:true },
      { label:'Produção total', sub:'  ·  faturado + não contabilizado', valFmt:E(c.producao), strong:true },
    ] : []),
    { label:'Saldo a faturar', sub:'', valFmt:E(c.saldo), strong:true, warn:true },
  ].map(l => ({ label:l.label, sub:l.sub||'', valFmt:l.valFmt, rowStyle:lineRow(l.strong), labelStyle:lblS(l.strong),
    subStyle:{ fontSize:'12px', color:'#a4adbd', fontWeight:400 },
    valStyle:valS(l.strong, l.warn?(c.saldo > 0.005 ? '#c77d1a' : '#12895e'):(l.pos?'#12895e':(l.neg?'#cf4b3a':null))) }));

  // ---- Autos de medição (com acumulado e %) ----
  const seedVis = seedAutosVisiveis(selObra, state);
  const nSeed = seedVis.length;
  const fatList = autosFaturaveis(selObra, state); // mesma ordem que c.autos
  let acc = 0;
  const autos = c.autos.map((a, idx) => {
    acc += a.total; const cum = c.adjud + acc; const pct = valorObra ? cum/valorObra : 0;
    const isUser = idx >= nSeed; const uIdx = isUser ? idx - nSeed : -1;
    const origIdx = isUser ? -1 : seedVis[idx];
    const fRef = fatList[idx] || {};
    const faturado = !!fRef.faturado;
    const key = fRef.key;
    const aprov = fRef.aprov || 'rascunho';
    const info = key ? aprovInfo(selObra, state, key) : { motivo:'' };
    const am = aprovMeta(aprov);
    const podeEnviar = !!opts.podeEditar && (aprov === 'rascunho' || aprov === 'reprovado') && !faturado;
    // ---- Histórico do auto: enviado → aprovado/reprovado → (proforma) → faturado.
    // Só inclui marcos que já aconteceram (têm data registada). Datas vêm do
    // fluxo de aprovação (dataEnvio/dataDecisao) e de faturação (proforma/fatura).
    const fd = key ? fatDatas(selObra, state, key) : { dataProforma:null, dataFatura:null };
    const marcos = [];
    if(info.dataEnvio) marcos.push({ label:'Enviado', dataFmt:fmt.fmtDate(info.dataEnvio), cor:'#8a94a6' });
    if(info.dataDecisao){
      const dm = aprov === 'reprovado' ? { label:'Reprovado', cor:'#cf4b3a' } : { label:'Aprovado', cor:'#12895e' };
      marcos.push({ label:dm.label, dataFmt:fmt.fmtDate(info.dataDecisao), cor:dm.cor });
    }
    if(fd.dataProforma) marcos.push({ label:'Proforma', dataFmt:fmt.fmtDate(fd.dataProforma), cor:ACC });
    if(fd.dataFatura) marcos.push({ label:'Faturado', dataFmt:fmt.fmtDate(fd.dataFatura), cor:'#12895e' });
    const timeline = marcos.map((mk, i) => ({
      label:mk.label, dataFmt:mk.dataFmt, naoPrimeiro:i !== 0,
      dotStyle:{ width:'7px', height:'7px', borderRadius:'999px', background:mk.cor, flex:'none' },
      labelStyle:{ fontSize:'11px', fontWeight:600, color:mk.cor },
      dateStyle:{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#8a94a6' },
    }));
    return { n:'Auto '+(idx+1), dataFmt:fmt.fmtDate(a.data), dataRaw:a.data, valorFmt:E(a.total), acumFmt:E(cum), pctFmt:P(pct),
      isFecho:!!a.fecho,
      faturado,
      timeline, temHistorico:timeline.length > 0,
      aprov, aprovLabel:am.label, aprovStyle:chipStyleDe(am),
      podeEnviar, enviarLabel: aprov === 'reprovado' ? 'Reenviar' : 'Enviar', enviarTitle: aprov === 'reprovado' ? 'Corrigir e reenviar para aprovação' : 'Enviar auto para aprovação do administrador',
      onEnviar: key ? (() => on.enviarAprovacao(selObra.codigo, key)) : (() => {}),
      temMotivo: aprov === 'reprovado' && !!info.motivo, motivo:info.motivo || '',
      fatLabel:'Faturado', fatStyle:chipStyleDe({ cor:'#12895e', tint:'#e4f3ec' }),
      barStyle:{ width:(Math.min(1,pct)*100).toFixed(1)+'%', height:'100%', background:theme.estadoCor(selObra.estado), borderRadius:'999px', display:'block' },
      onPDF:() => on.abrirPDF(selObra.codigo, idx),
      onData: isUser ? (e) => on.setUserAutoData(selObra.codigo, uIdx, e.target.value)
                     : (e) => on.setSeedAutoData(selObra.codigo, origIdx, e.target.value),
      showDelete:!!opts.podeApagarAuto,
      onDelete: isUser ? () => on.deleteUserAuto(selObra.codigo, uIdx) : () => on.deleteSeedAuto(selObra.codigo, seedVis[idx]) };
  });

  // ---- Aprovação / acessos ----
  const adjKey = ADJ_KEY;
  const adjAprovInfo = aprovInfo(selObra, state, adjKey);
  const adjAprov = adjAprovInfo.estado;
  const adjFaturado = adjudFatEstado(selObra, state) === 'faturado';
  const adjMeta = aprovMeta(adjAprov);
  const adjPodeEnviar = !!opts.podeEditar && c.adjud > 0 && (adjAprov === 'rascunho' || adjAprov === 'reprovado') && !adjFaturado;

  // Gestão de acessos: só utilizadores (admin/gestor veem sempre tudo).
  const acAtual = Array.isArray(selObra.acessos) ? selObra.acessos : [];
  const utils = auth.UTILIZADORES.filter(u => u.papel === 'utilizador');
  const acessosUI = utils.map(u => {
    const marcado = acAtual.includes(u.user);
    return { user:u.user, nome:u.nome, iniciais:auth.iniciais(u.nome), marcado,
      onToggle:() => on.setObraAcesso(selObra.codigo, u.user),
      chipStyle:{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'6px 12px 6px 6px', borderRadius:'999px', cursor:'pointer',
        border:'1px solid '+(marcado ? ACC : '#dce1ea'), background:marcado ? '#eef4ff' : '#fff', color:marcado ? '#16273d' : '#8a94a6', fontSize:'12.5px', fontWeight:marcado ? 600 : 500, fontFamily:"'IBM Plex Sans',sans-serif" },
      avatarStyle:{ width:'24px', height:'24px', borderRadius:'999px', flex:'none', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'IBM Plex Mono',monospace", fontWeight:600, fontSize:'10.5px', background:marcado ? ACC : '#e4e8ef', color:marcado ? '#fff' : '#8a94a6' } };
  });
  const nComAcesso = acessosUI.filter(u => u.marcado).length;

  // ---- Custos de obra (lançamentos + categorias) ----
  // Os lançamentos incluem CUSTOS e VENDAS (mesma coleção). A VENDA é faturado,
  // não custo — separa-se aqui para não entrar nos totais/repartição de custos.
  const allEntries = (state.custosData[selObra.codigo]) || [];
  const entries = allEntries.filter(e => e.categoria !== VENDA_CAT);
  const vendaEntries = allEntries.filter(e => e.categoria === VENDA_CAT);
  // Feedback da importação de Excel de custos (só para esta obra).
  const impC = state.custoImport && state.custoImport.codigo === selObra.codigo ? state.custoImport : null;
  const impV = state.vendaImport && state.vendaImport.codigo === selObra.codigo ? state.vendaImport : null;
  const totalCustos = entries.reduce((s,e) => s + e.valor, 0);
  const hasCustos = entries.length > 0;
  const margemCustos = valorObra ? (valorObra - totalCustos)/valorObra : 0;
  const totalVendas = vendaEntries.reduce((s,e) => s + e.valor, 0);
  const hasVendas = vendaEntries.length > 0;

  const catTotals = {}; theme.CATS.forEach(cat => catTotals[cat] = 0);
  entries.forEach(e => { if(catTotals[e.categoria] !== undefined) catTotals[e.categoria] += e.valor; });
  const custosCats = theme.CATS.map(cat => {
    const v = catTotals[cat] || 0; const pct = totalCustos ? v/totalCustos : 0;
    return { label:cat, valorFmt:v > 0 ? E0(v) : '—', pctFmt:P(pct), hasVal:v > 0,
      stackSegStyle:{ flex:totalCustos > 0 && v > 0 ? v/totalCustos : 0, background:theme.catCor(cat), minWidth:'0' },
      tagStyle:{ display:'inline-flex', alignItems:'center', padding:'3px 9px', borderRadius:'6px', fontSize:'12px', fontWeight:600, color:theme.catCor(cat), background:theme.catTint(cat) } };
  });
  const custosEntriesAll = [...entries].sort((a,b) => b.data.localeCompare(a.data));
  // Filtro AUTOMÁTICO por família (= categoria). As famílias mostradas são só as
  // que existem nos lançamentos desta obra; a contagem/total vêm dos dados.
  const famDe = (e) => e.familia || e.categoria || 'Outros';
  const famAgg = {}; // { familia: { n, total } }
  custosEntriesAll.forEach(e => { const f = famDe(e); (famAgg[f] = famAgg[f] || { n:0, total:0 }); famAgg[f].n++; famAgg[f].total += e.valor; });
  const famsPresentes = theme.CATS.filter(c => famAgg[c]).concat(Object.keys(famAgg).filter(f => !theme.CATS.includes(f)));
  let famSel = state.custoFamilia || 'Todas';
  if(famSel !== 'Todas' && !famAgg[famSel]) famSel = 'Todas'; // família já sem lançamentos
  const chipStyle = (active, cor, tint) => ({ display:'inline-flex', alignItems:'center', gap:'8px', padding:'7px 13px', borderRadius:'9px', cursor:'pointer',
    border:'1px solid '+(active ? cor : '#dce1ea'), background:active ? cor : '#fff', color:active ? '#fff' : '#56627a', fontSize:'12.5px', fontWeight:active ? 600 : 500, fontFamily:"'IBM Plex Sans',sans-serif" });
  const countStyle = (active) => ({ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', fontWeight:600, padding:'1px 6px', borderRadius:'5px', background:active ? 'rgba(255,255,255,.2)' : '#eef1f5', color:active ? '#fff' : '#8a94a6' });
  const custoFamilias = [{ label:'Todas', count:custosEntriesAll.length, active:famSel === 'Todas',
      style:chipStyle(famSel === 'Todas', '#16273d'), countStyle:countStyle(famSel === 'Todas'), onClick:() => on.setCustoFamilia('Todas') }]
    .concat(famsPresentes.map(f => { const active = famSel === f;
      return { label:f, count:famAgg[f].n, active, style:chipStyle(active, theme.catCor(f), theme.catTint(f)), countStyle:countStyle(active), onClick:() => on.setCustoFamilia(f) }; }));

  const custosEntries = custosEntriesAll.filter(e => famSel === 'Todas' || famDe(e) === famSel).map(e => ({
    dataFmt:fmt.fmtDate(e.data), categoria:famDe(e), codigo:e.codigo || '',
    tagStyle:{ display:'inline-flex', alignItems:'center', padding:'3px 9px', borderRadius:'6px', fontSize:'12px', fontWeight:600, color:theme.catCor(e.categoria), background:theme.catTint(e.categoria) },
    descricao:e.descricao, fornecedor:e.fornecedor || '—', valorFmt:E(e.valor),
    onDelete:() => on.deleteCusto(selObra.codigo, e.id) }));
  const famSelTotal = famSel === 'Todas' ? totalCustos : (famAgg[famSel] ? famAgg[famSel].total : 0);

  // ---- Vendas (faturado): lançamentos marcados como Venda, listados à parte ----
  const vendasEntriesList = [...vendaEntries].sort((a,b) => String(b.data).localeCompare(String(a.data))).map(e => ({
    dataFmt:fmt.fmtDate(e.data), descricao:e.descricao, fornecedor:e.fornecedor || '—', codigo:e.codigo || '',
    valorFmt:E(e.valor),
    onDelete:() => on.deleteCusto(selObra.codigo, e.id) }));

  const custoRaw = hasCustos ? Math.round(totalCustos) : Math.round(c.custo);

  // ---- Gráfico em anel (donut) da obra: total OU repartição por auto ----
  const PIE_PAL = ['#2f6fed','#12895e','#c77d1a','#7a5af5','#d5527f','#1d9ec9','#4d6a92','#b3543e','#5a8f3d','#946bd6','#2aa198','#8a94a6'];
  const pieTabStyle = (active) => ({ padding:'5px 12px', borderRadius:'7px', cursor:'pointer', fontSize:'12px', fontWeight:active?600:500, fontFamily:"'IBM Plex Sans',sans-serif",
    border:'1px solid '+(active?'#16273d':'#dce1ea'), background:active?'#16273d':'#fff', color:active?'#fff':'#56627a' });
  const pieModo = state.obraPieModo === 'autos' ? 'autos' : 'total';
  const pieAutoSel = (pieModo === 'autos' && state.obraPieAuto != null && state.obraPieAuto >= 0 && state.obraPieAuto < c.autos.length) ? state.obraPieAuto : null;
  let pieDefs, pieCentroFmt, pieCentroLabel, pieSubtitle;
  if(pieModo === 'autos' && pieAutoSel != null){
    // Detalhe de UM auto: a sua produção face à adjudicação, autos anteriores e
    // valor ainda disponível por medir.
    const a = c.autos[pieAutoSel];
    let antes = 0; c.autos.forEach((x, i) => { if(i < pieAutoSel) antes += x.total; });
    antes = Math.round(antes * 100) / 100;
    const disp = Math.max(0, Math.round((valorObra - c.adjud - antes - a.total) * 100) / 100);
    pieDefs = [
      ['Adjudicação', c.adjud, '#16273d'],
      ['Autos anteriores', antes, '#aeb8c8'],
      ['Auto ' + (pieAutoSel + 1) + ' · produção', a.total, ACC],
      ['Disponível por medir', disp, '#dde2ea'],
    ].filter(d => d[1] > 0);
    pieCentroFmt = E0(a.total); pieCentroLabel = 'produção · Auto ' + (pieAutoSel + 1);
    pieSubtitle = 'Produção do Auto ' + (pieAutoSel + 1) + ' · ' + fmt.fmtDate(a.data) + ' · face ao valor da obra';
  } else if(pieModo === 'autos'){
    pieDefs = [];
    if(c.adjud > 0) pieDefs.push(['Adjudicação', c.adjud, '#16273d']);
    c.autos.forEach((a, i) => pieDefs.push(['Auto ' + (i + 1) + ' · ' + fmt.fmtDate(a.data), a.total, PIE_PAL[i % PIE_PAL.length]]));
    if(c.tncTotal > 0) pieDefs.push(['Trabalho não contabilizado', c.tncTotal, '#e0a63a']);
    if(c.saldo > 0.005) pieDefs.push(['Saldo a faturar', c.saldo, '#dde2ea']);
    pieCentroFmt = E0(valorObra); pieCentroLabel = 'valor da obra';
    pieSubtitle = 'Adjudicação, autos de medição e saldo por faturar — escolha um auto para o detalhe';
  } else {
    pieDefs = [
      ['Valor total da obra', valorObra, '#16273d'],
      ['Produção', c.producao, ACC],
      ['Faturado', faturadoReal(selObra, state), '#12895e'],
      ['Custos', c.custo, '#aeb8c8'],
    ];
    pieCentroFmt = E0(valorObra); pieCentroLabel = 'valor da obra';
    pieSubtitle = 'Valor total da obra, produção, faturado e custos';
  }
  const pieSum = pieDefs.reduce((s, d) => s + d[1], 0) || 1;
  let pieCum = 0; const pieParts = [];
  const pieLegend = pieDefs.map(([label, val, color]) => {
    const frac = val / pieSum; const a0 = pieCum * 360, a1 = (pieCum + frac) * 360;
    pieParts.push(color + ' ' + a0.toFixed(2) + 'deg ' + a1.toFixed(2) + 'deg'); pieCum += frac;
    return { label, valueFmt:E0(val), pctFmt:P(frac), swatchStyle:{ width:'11px', height:'11px', borderRadius:'3px', background:color, flex:'none' } };
  });
  const pie = {
    ringStyle:{ width:'176px', height:'176px', borderRadius:'50%', background:pieDefs.length ? 'conic-gradient(' + pieParts.join(',') + ')' : '#eef1f5', flex:'none' },
    legend:pieLegend, valorTotalFmt:E0(valorObra),
    centroFmt:pieCentroFmt, centroLabel:pieCentroLabel,
    subtitle: pieSubtitle,
    temAutos: pieModo === 'autos' && c.autos.length > 0,
    autosTabs: pieModo === 'autos'
      ? [{ label:'Todos', onClick:() => on.setObraPieAuto(null), style:pieTabStyle(pieAutoSel == null) }]
        .concat(c.autos.map((a, i) => ({ label:'Auto ' + (i + 1), onClick:() => on.setObraPieAuto(i), style:pieTabStyle(pieAutoSel === i) })))
      : [],
    tabs: [
      { label:'Total', onClick:() => on.setObraPieModo('total'), style:pieTabStyle(pieModo === 'total') },
      { label:'Por auto', onClick:() => on.setObraPieModo('autos'), style:pieTabStyle(pieModo === 'autos') },
    ],
  };

  // ---- Trabalho não contabilizado (separador Controlo financeiro) ----
  // Lançamentos de produção fora dos autos: entram na produção e no lucro,
  // mas nunca aparecem na Faturação.
  const tncEntries = tncDe(selObra, state);
  const tf = state.tncForm || {};
  const tnc = {
    has: tncEntries.length > 0, vazio: tncEntries.length === 0,
    count: tncEntries.length, totalFmt: E0(c.tncTotal),
    entries: [...tncEntries].sort((a,b) => String(b.data).localeCompare(String(a.data))).map(e => ({
      dataFmt: fmt.fmtDate(e.data), descricao: e.descricao || '—', valorFmt: E(e.valor),
      onDelete: () => on.tncDel(selObra.codigo, e.id) })),
    form: {
      data: tf.data || '', descricao: tf.descricao || '', valor: tf.valor || '',
      onData: (e) => on.tncField('data', e.target.value),
      onDescricao: (e) => on.tncField('descricao', e.target.value),
      onValor: (e) => on.tncField('valor', e.target.value),
      onAdd: () => on.tncAdd(selObra.codigo),
    },
  };

  const sel = {
    codigo:selObra.codigo, titulo:selObra.titulo, cliente:selObra.cliente, local:selObra.local, estado:selObra.estado,
    podeEditar:!!opts.podeEditar,
    estadoStyle:{ display:'inline-flex', alignItems:'center', padding:'5px 12px', borderRadius:'7px', fontSize:'13px', fontWeight:600, color:theme.estadoCor(selObra.estado), background:theme.estadoTint(selObra.estado) },
    estadoOpts:['Em execução', 'Adjudicada', 'Em orçamento', 'Concluída'],
    onEstado:(e) => on.setEstado(selObra.codigo, e.target.value),
    estadoSelectStyle:{ appearance:'auto', WebkitAppearance:'auto', fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'13px', fontWeight:600, color:theme.estadoCor(selObra.estado), background:theme.estadoTint(selObra.estado), border:'1px solid '+theme.estadoCor(selObra.estado), borderRadius:'7px', padding:'5px 8px 5px 11px', cursor:'pointer', outline:'none' },
    inicioFmt:fmt.fmtDate(selObra.inicio),
    valorFmt:E0(valorObra), custoFmt:E0(c.custo), custoRaw, faturadoFmt:E0(c.faturado), saldoFmt:E0(c.saldo),
    lucroFmt:E0(c.lucro), margemFmt:P(c.margem),
    lucroValStyle:theme.numStyle(c.lucro >= 0 ? '#12895e' : '#cf4b3a', '19px'),
    margemValStyle:theme.numStyle(theme.margemCor(c.margem), '19px'),
    saldoValStyle:theme.numStyle(c.saldo > 0.005 ? '#c77d1a' : '#12895e', '19px'),
    lucroBigStyle:theme.numStyle(c.lucro >= 0 ? '#12895e' : '#cf4b3a', '20px'),
    margemBigStyle:{ fontFamily:"'IBM Plex Mono',monospace", fontVariantNumeric:'tabular-nums', fontWeight:600, fontSize:'24px', color:theme.margemCor(c.margem) },
    custoPctFmt:P(custoFrac), lucroPctFmt:P(1-custoFrac),
    custoSegStyle:{ width:(custoFrac*100).toFixed(1)+'%', background:'#aeb8c8', height:'100%', flex:'none' },
    lucroSegStyle:{ flex:'1', minWidth:'0', background:c.lucro >= 0 ? '#12895e' : '#cf4b3a', height:'100%' },
    avgMargemFmt:P(mM), vsAvgFmt:(c.margem >= mM ? '+' : '')+P(c.margem - mM),
    vsAvgStyle:{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:600, color:c.margem >= mM ? '#12895e' : '#cf4b3a' },
    custoInputStyle:{ flex:'1', border:'none', outline:'none', background:'transparent', fontSize:'18px', fontWeight:600, color:hasCustos?'#8a94a6':'#16202e', padding:'11px 0', fontVariantNumeric:'tabular-nums', width:'100%' },
    pctFatFmt:P(c.pctFat), autosCount:c.autos.length,
    fechada:!!c.fecho,
    podeFechar:!!opts.podeEditar && !c.fecho,
    podeNovoAuto:!!opts.podeEditar && !c.fecho,
    fechoDataFmt:c.fecho ? fmt.fmtDate(c.fecho.data) : '',
    naoExecFmt:E(c.naoExec), acertoFmt:E(c.acertoAdjud), faturadoFinalFmt:E(c.faturado),
    onFechar:() => on.fecharObra(selObra.codigo),
    hasAdjud:c.adjud > 0, adjudFmt:E(c.adjud), adjudDataFmt:fmt.fmtDate(selObra.inicio), adjudPctCumFmt:P(valorObra ? c.adjud/valorObra : 0),
    adjudAprov:adjAprov, adjudAprovLabel:adjMeta.label, adjudAprovStyle:chipStyleDe(adjMeta),
    adjudFaturado:adjFaturado, adjudPodeEnviar:adjPodeEnviar,
    adjudEnviarLabel: adjAprov === 'reprovado' ? 'Reenviar' : 'Enviar', adjudEnviarTitle: adjAprov === 'reprovado' ? 'Corrigir e reenviar para aprovação' : 'Enviar adjudicação para aprovação',
    onAdjudEnviar:() => on.enviarAprovacao(selObra.codigo, adjKey),
    adjudTemMotivo: adjAprov === 'reprovado' && !!adjAprovInfo.motivo, adjudMotivo:adjAprovInfo.motivo || '',
    podeGerirAcessos:!!opts.podeEditar, acessosUI, nComAcesso, acessosResumo: nComAcesso === 0 ? 'Só admin e gestores' : (nComAcesso + (nComAcesso === 1 ? ' utilizador' : ' utilizadores')),
    cfValor, cfFat, autos, noAutos:c.autos.length === 0, tnc,
    onCusto:(e) => on.setCusto(selObra.codigo, e),
    hasCustos, noCustos:!hasCustos, custosCount:entries.length, custosTotalFmt:hasCustos ? E0(totalCustos) : '—',
    custosMargemFmt:P(margemCustos), custosMargemStyle:{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:600, color:theme.margemCor(margemCustos) },
    custosCats, custosEntries, noCustosEntries:custosEntries.length === 0,
    custoFamilias, custoFamiliaSel:famSel, custoFamiliaTotalFmt:E0(famSelTotal),
    custoFamiliaFiltrada:famSel !== 'Todas',
    // Importar custos de Excel (materiais / equipamentos / recursos humanos).
    custoImp: {
      onEscolherArquivo:(e) => { const fs = e.target.files; if(fs && fs.length) on.custoImportar(selObra.codigo, Array.from(fs)); e.target.value = ''; },
      onDropArquivo:(e) => { e.preventDefault(); const z = e.currentTarget; z.style.background = '#eaf0fe'; z.style.borderColor = '#bcd0f7'; const fs = e.dataTransfer && e.dataTransfer.files; if(fs && fs.length) on.custoImportar(selObra.codigo, Array.from(fs)); },
      onDragOver:(e) => { e.preventDefault(); const z = e.currentTarget; z.style.background = '#dde9ff'; z.style.borderColor = '#2f6fed'; },
      onDragLeave:(e) => { const z = e.currentTarget; z.style.background = '#eaf0fe'; z.style.borderColor = '#bcd0f7'; },
      importOk: !!(impC && !impC.erro), importErro: !!(impC && impC.erro), importMsg: impC ? impC.msg : '',
    },
    // ---- Vendas (faturado) ----
    hasVendas, noVendas:!hasVendas, vendasCount:vendaEntries.length,
    vendasTotalFmt: hasVendas ? E0(totalVendas) : '—',
    vendasEntries: vendasEntriesList, noVendasEntries: vendasEntriesList.length === 0,
    // Importar vendas (faturação Ofigeste): marca as linhas como Venda.
    vendaImp: {
      onEscolherArquivo:(e) => { const fs = e.target.files; if(fs && fs.length) on.vendaImportar(selObra.codigo, Array.from(fs)); e.target.value = ''; },
      onDropArquivo:(e) => { e.preventDefault(); const z = e.currentTarget; z.style.background = '#e4f3ec'; z.style.borderColor = '#a8d8bf'; const fs = e.dataTransfer && e.dataTransfer.files; if(fs && fs.length) on.vendaImportar(selObra.codigo, Array.from(fs)); },
      onDragOver:(e) => { e.preventDefault(); const z = e.currentTarget; z.style.background = '#d3efdd'; z.style.borderColor = '#12895e'; },
      onDragLeave:(e) => { const z = e.currentTarget; z.style.background = '#e4f3ec'; z.style.borderColor = '#a8d8bf'; },
      importOk: !!(impV && !impV.erro), importErro: !!(impV && impV.erro), importMsg: impV ? impV.msg : '',
    },
    onNovoAuto:() => on.novoAuto(selObra.codigo),
    onNovoCusto:() => on.novoCusto(selObra.codigo),
    onAutoBase:() => on.setTab('orcamento'),
    // Editor do mapa de trabalhos (separador Orçamento)
    orc: buildOrcamento(selObra, state, opts, on),
  };

  return { sel, pie, tabs, tabRent, tabOrc, tabCustos, tabCF, tabAutos, podeEditar:!!opts.podeEditar, soLeitura:!opts.podeEditar, onBack:() => on.back() };
}
