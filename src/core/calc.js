// ============================================================
// core/calc.js — CÁLCULOS DE NEGÓCIO (camada CORE)
// Funções PURAS sobre (obra, estado). Sem UI.
// "estado" = { custoOverrides, autosData, custosData, orcamentoData, adjudPctData }.
//
// Modelo financeiro (igual ao Excel):
//   Valor da obra = soma(artigos) + soma(extra)
//   Por auto:
//     autoOrc   = Σ qtd_artigo × vunit
//     deducao   = -autoOrc × adjudPct          (dedução de adjudicação)
//     aFacturar = autoOrc + deducao
//     autoExtra = Σ qtd_extra × vunit          (trabalhos a mais)
//     total     = aFacturar + autoExtra        (Total do auto faturado)
//   Faturado total = adjud + Σ total dos autos
// ============================================================

function round2(x){ return Math.round(x * 100) / 100; }
// Linhas de TÍTULO de divisão (_sec) só organizam o mapa — não contam nos totais nem nos autos.
function somaItens(items){ return round2((items || []).filter(it => !it._sec).reduce((s,it) => s + (it.qt||0) * (it.vunit||0), 0)); }

// Categoria especial de lançamento: uma VENDA vive na mesma coleção dos custos
// (`custosData`) mas conta como FATURADO/receita, NUNCA como custo. É a fonte do
// "faturado" da carteira quando existe (ver calc/faturadoReal/fluxoCarteira).
export const VENDA_CAT = 'Venda';

// ---- Getters do estado efetivo (default da semente ou edição do utilizador) ----
export function orcamentoDe(obra, state){
  const ov = state.orcamentoData && state.orcamentoData[obra.codigo];
  // O Firebase APAGA arrays vazios ao gravar: um orçamento guardado como
  // { artigos:[…], extra:[] } volta SEM `extra` (undefined). Normaliza sempre
  // para arrays — senão qualquer `orc.extra.map(…)` rebenta o render. Considera
  // o override presente se tiver artigos OU extra.
  const base = (ov && (ov.artigos || ov.extra)) ? ov : obra.orcamento;
  return { artigos: base.artigos || [], extra: base.extra || [] };
}
export function adjudPctDe(obra, state){
  const v = state.adjudPctData && state.adjudPctData[obra.codigo];
  return (v === undefined || v === null || isNaN(v)) ? obra.adjudPctDefault : v;
}
export function autosDe(obra, state){
  // Autos semente que o utilizador eliminou (índices na lista original).
  const del = (state.autosSeedDel && state.autosSeedDel[obra.codigo]) || [];
  // Datas de autos semente alteradas pelo utilizador (por índice original).
  const ovr = (state.autosSeedData && state.autosSeedData[obra.codigo]) || {};
  const seeds = obra.seedAutos
    .map((a, i) => (ovr[i] ? Object.assign({}, a, ovr[i]) : a))
    .filter((_, i) => !del.includes(i));
  return [...seeds, ...((state.autosData && state.autosData[obra.codigo]) || [])];
}
// Índices originais dos autos semente que continuam visíveis (após eliminações).
export function seedAutosVisiveis(obra, state){
  const del = (state.autosSeedDel && state.autosSeedDel[obra.codigo]) || [];
  return obra.seedAutos.map((_, i) => i).filter(i => !del.includes(i));
}

// Estado de faturação de uma CHAVE qualquer de uma obra (auto ou 'ADJ').
// pendente -> proforma -> faturado. O valor guardado pode ser:
//   objeto { estado, dataProforma, dataFatura }  (formato atual, com datas)
//   string 'proforma' | 'faturado'               (compat)
//   true                                          (compat antigo = faturado)
export function fatEstado(obra, state, key){
  const fat = (state.autoFatData && state.autoFatData[obra.codigo]) || {};
  return _estadoDeValor(fat[key]);
}
function _estadoDeValor(v){
  const est = (v && typeof v === 'object') ? v.estado : v;
  return (est === 'faturado' || v === true) ? 'faturado' : (est === 'proforma' ? 'proforma' : 'pendente');
}
// Datas de proforma / fatura de uma chave (null se não registadas).
export function fatDatas(obra, state, key){
  const fat = (state.autoFatData && state.autoFatData[obra.codigo]) || {};
  const v = fat[key];
  return (v && typeof v === 'object') ? { dataProforma:v.dataProforma || null, dataFatura:v.dataFatura || null } : { dataProforma:null, dataFatura:null };
}
// Códigos de fatura (proforma / fatura) de uma chave (string vazia se ausente).
export function fatCodigos(obra, state, key){
  const fat = (state.autoFatData && state.autoFatData[obra.codigo]) || {};
  const v = fat[key];
  return (v && typeof v === 'object') ? { codProforma:v.codProforma || '', codFatura:v.codFatura || '' } : { codProforma:'', codFatura:'' };
}

// ---- Aprovação (fluxo: rascunho → pendente → aprovado | reprovado) ----
// O criador do auto envia para aprovação; o admin aprova ou reprova. Só depois
// de APROVADO é que o item aparece na Faturação para o gestor/admin faturar.
// O reprovado volta ao criador, que corrige e reenvia (→ pendente).
export function aprovDe(obra, state, key){
  const ap = (state.autoAprovData && state.autoAprovData[obra.codigo]) || {};
  const v = ap[key];
  const e = (v && typeof v === 'object') ? v.estado : v;
  return (e === 'pendente' || e === 'aprovado' || e === 'reprovado') ? e : 'rascunho';
}
export function aprovInfo(obra, state, key){
  const ap = (state.autoAprovData && state.autoAprovData[obra.codigo]) || {};
  const v = ap[key];
  const base = (v && typeof v === 'object') ? v : {};
  return { estado:aprovDe(obra, state, key), dataEnvio:base.dataEnvio || null, dataDecisao:base.dataDecisao || null, motivo:base.motivo || '', por:base.por || '' };
}
// A adjudicação usa a chave reservada 'ADJ'. Uma vez FATURADA, fica bloqueada:
// não se pode mais alterar a % / valor de adjudicação da obra.
export const ADJ_KEY = 'ADJ';
export function adjudFatEstado(obra, state){ return fatEstado(obra, state, ADJ_KEY); }
export function adjudBloqueada(obra, state){ return adjudFatEstado(obra, state) === 'faturado'; }

// Total REALMENTE faturado de uma obra = itens (adjudicação + autos) marcados
// como 'faturado' no separador de Faturação. Distinto de "produção" (tudo o
// que foi medido) e de calc().faturado (adjud + total dos autos).
export function faturadoReal(obra, state){
  // Quando a obra tem VENDAS carregadas, o faturado real vem delas.
  if(vendasDe(obra, state).length > 0) return vendasTotalDe(obra, state);
  let tot = 0;
  autosFaturaveis(obra, state).forEach(a => { if(a.faturado) tot += a.total; });
  if(adjudFatEstado(obra, state) === 'faturado') tot += adjudDe(obra, state);
  return round2(tot);
}

// Chave estável de um auto (para guardar o estado de faturação).
//   seed -> 's<origIdx>'   ·   utilizador -> 'u<id>' (ou 'u#<idx>' se sem id).
export function autoKey(ref){
  if(ref.tipo === 'seed') return 's' + ref.origIdx;
  return 'u' + (ref.id != null ? ref.id : ('#' + ref.userIdx));
}

// Lista de autos de uma obra ENRIQUECIDA com referência estável, valor e
// estado de faturação (para o separador de Faturação e badges).
// Ordem = igual a autosDe (semente visível, depois autos do utilizador),
// pelo que o índice+1 corresponde ao "Auto N" mostrado no detalhe.
export function autosFaturaveis(obra, state){
  const orc = orcamentoDe(obra, state);
  const pct = adjudPctDe(obra, state);
  const fat = (state.autoFatData && state.autoFatData[obra.codigo]) || {};
  const ovr = (state.autosSeedData && state.autosSeedData[obra.codigo]) || {};
  const seedVis = seedAutosVisiveis(obra, state);
  // Estado de faturação de um auto: pendente -> proforma -> faturado.
  // Compat: valor `true`/string ou objeto { estado, dataFatura, dataProforma }.
  const estadoFatDe = (k) => _estadoDeValor(fat[k]);
  const dataFatDe = (k) => { const v = fat[k]; return (v && typeof v === 'object') ? (v.dataFatura || null) : null; };
  const codDe = (k) => { const v = fat[k]; return (v && typeof v === 'object') ? { codProforma:v.codProforma || '', codFatura:v.codFatura || '' } : { codProforma:'', codFatura:'' }; };
  const ap = (state.autoAprovData && state.autoAprovData[obra.codigo]) || {};
  const aprovDeK = (k) => { const v = ap[k]; const e = (v && typeof v === 'object') ? v.estado : v; return (e === 'pendente' || e === 'aprovado' || e === 'reprovado') ? e : 'rascunho'; };
  const out = [];
  seedVis.forEach(origIdx => {
    const a = ovr[origIdx] ? Object.assign({}, obra.seedAutos[origIdx], ovr[origIdx]) : obra.seedAutos[origIdx];
    const v = autoValores(orc, pct, a);
    const key = autoKey({ tipo:'seed', origIdx });
    const ef = estadoFatDe(key); const cc = codDe(key);
    out.push({ tipo:'seed', origIdx, userIdx:-1, key, data:a.data, total:v.total, estadoFat:ef, faturado: ef === 'faturado', dataFatura: dataFatDe(key), aprov:aprovDeK(key), codProforma:cc.codProforma, codFatura:cc.codFatura });
  });
  const us = (state.autosData && state.autosData[obra.codigo]) || [];
  us.forEach((a, idx) => {
    const v = autoValores(orc, pct, a);
    const key = autoKey({ tipo:'user', id:a.id, userIdx:idx });
    const ef = estadoFatDe(key); const cc = codDe(key);
    out.push({ tipo:'user', origIdx:-1, userIdx:idx, key, data:a.data, total:v.total, estadoFat:ef, faturado: ef === 'faturado', dataFatura: dataFatDe(key), aprov:aprovDeK(key), codProforma:cc.codProforma, codFatura:cc.codFatura });
  });
  return out.map((o, i) => Object.assign({ n:i + 1 }, o));
}

// Itens do mapa de trabalhos EFETIVO (já com edições do utilizador), por _k.
// Cada item leva _lista ('artigos' | 'extra') para se saber se é trabalho a
// mais (sem dedução de adjudicação). Substitui o orcItems estático da semente.
export function orcItensDe(obra, state){
  const orc = orcamentoDe(obra, state);
  return [
    ...(orc.artigos || []).map(it => Object.assign({ _lista:'artigos' }, it)),
    ...(orc.extra   || []).map(it => Object.assign({ _lista:'extra' }, it)),
  ];
}

// Custo efetivo: lançamentos > override manual > custo base.
// As VENDAS são excluídas (vivem na mesma coleção mas são faturado, não custo).
export function custoDe(obra, state){
  const ents = ((state.custosData && state.custosData[obra.codigo]) || []).filter(e => e.categoria !== VENDA_CAT);
  if(ents.length > 0) return ents.reduce((s,e) => s + e.valor, 0);
  const ov = state.custoOverrides && state.custoOverrides[obra.codigo];
  return (ov === undefined || ov === null || isNaN(ov)) ? obra.custoBase : ov;
}

// VENDAS de uma obra: lançamentos marcados como Venda (faturado/receita).
export function vendasDe(obra, state){
  return ((state.custosData && state.custosData[obra.codigo]) || []).filter(e => e.categoria === VENDA_CAT);
}
export function vendasTotalDe(obra, state){ return round2(vendasDe(obra, state).reduce((s,e) => s + (e.valor || 0), 0)); }

// Trabalho NÃO CONTABILIZADO: produção real fora do mapa/autos. Entra na
// produção e no lucro (da obra e da carteira), mas NUNCA na faturação —
// não aparece nos autos faturáveis nem no saldo a faturar.
export function tncDe(obra, state){ return (state.tncData && state.tncData[obra.codigo]) || []; }
export function tncTotalDe(obra, state){ return round2(tncDe(obra, state).reduce((s,e) => s + (e.valor || 0), 0)); }

// AUTO DE FECHO: registo { data } que conclui a obra. Ao fechar com trabalho
// a menos, a adjudicação foi paga sobre TODO o orçamento mas as deduções dos
// autos só recuperaram a parte medida — o fecho devolve a adjudicação dos
// trabalhos não executados (acertoAdjud, negativo). Não entra na produção nem
// no acumulado dos autos; desconta apenas no total a receber.
export function fechoDe(obra, state){
  const f = state.fechoData && state.fechoData[obra.codigo];
  return (f && typeof f === 'object') ? f : null;
}

// Totais do mapa de trabalhos.
export function orcTotais(orcamento){
  const orcT = somaItens(orcamento.artigos);
  const extraT = somaItens(orcamento.extra);
  return { orcT, extraT, total: round2(orcT + extraT) };
}

// Valor da ADJUDICAÇÃO (derivado) = orçamento dos artigos × % de dedução.
// É o par do adjudPct: muda a % → muda o valor; muda o valor → muda a %.
// Os trabalhos a mais não contam (não têm adjudicação).
export function adjudDe(obra, state){
  const orc = orcamentoDe(obra, state);
  const pct = adjudPctDe(obra, state);
  return round2(somaItens(orc.artigos) * pct);
}

// Desdobramento de um auto (estilo Excel).
export function autoValores(orcamento, adjudPct, auto){
  const arts = orcamento.artigos || [];
  const exts = orcamento.extra || [];
  const qa = auto.qtds || {}, qe = auto.qtdsExtra || {};
  const autoOrc   = round2(arts.reduce((s,it) => s + (it._sec ? 0 : (qa[it._k] || 0) * (it.vunit || 0)), 0));
  const deducao   = round2(-autoOrc * adjudPct);
  const aFacturar = round2(autoOrc + deducao);
  const autoExtra = round2(exts.reduce((s,it) => s + (it._sec ? 0 : (qe[it._k] || 0) * (it.vunit || 0)), 0));
  const total     = round2(aFacturar + autoExtra);
  return { autoOrc, deducao, aFacturar, autoExtra, total };
}

// Indicadores financeiros de uma obra (já com autos avaliados).
export function calc(obra, state){
  const orc = orcamentoDe(obra, state);
  const pct = adjudPctDe(obra, state);
  const { orcT, extraT, total: valorObra } = orcTotais(orc);

  const custo  = round2(custoDe(obra, state));
  const tncTotal = tncTotalDe(obra, state);

  const autosRaw = autosDe(obra, state);
  let autosTotal = 0, orcMedido = 0;
  const autos = autosRaw.map(a => { const v = autoValores(orc, pct, a); autosTotal = round2(autosTotal + v.total); orcMedido = round2(orcMedido + v.autoOrc); return Object.assign({}, a, v); });

  const adjud = round2(orcT * pct);

  // Auto de fecho: acerto da adjudicação sobre o trabalho não executado.
  const fecho = fechoDe(obra, state);
  const naoExec = fecho ? round2(Math.max(0, orcT - orcMedido)) : 0;
  const acertoAdjud = fecho ? round2(-naoExec * pct) : 0;

  // FATURADO: das VENDAS carregadas quando existem (fonte real da faturação);
  // senão, o cálculo clássico pelos autos + adjudicação (fallback, não parte
  // nada nas obras que ainda não usam vendas). A produção vem sempre dos autos.
  const vendasTot = vendasTotalDe(obra, state);
  const temVendas = vendasDe(obra, state).length > 0;
  const faturado = temVendas ? vendasTot : round2(adjud + autosTotal + acertoAdjud);
  const producao = round2(adjud + autosTotal + tncTotal);
  // Valor efetivo: com fecho, o valor real da obra é só o executado.
  const valorEfetivo = fecho ? round2(valorObra - naoExec) : valorObra;
  const lucro  = round2(valorEfetivo + tncTotal - custo);
  const margem = (valorEfetivo + tncTotal) ? lucro / (valorEfetivo + tncTotal) : 0;
  const saldo    = fecho ? 0 : round2(valorObra - faturado);
  const pctFat   = fecho ? 1 : (valorObra ? Math.max(0, Math.min(1, faturado / valorObra)) : 0);

  return { orc, pct, orcT, extraT, valorObra, valorEfetivo, custo, lucro, margem, autos, autosTotal, orcMedido, faturado, producao, tncTotal, fecho, naoExec, acertoAdjud, saldo, pctFat, adjud, vendasTot, temVendas };
}

// Totais agregados da carteira (obras ganhas vs. propostas em orçamento).
export function carteiraTotais(obras, state){
  const won       = obras.filter(o => o.estado !== 'Em orçamento');
  const propostas = obras.filter(o => o.estado === 'Em orçamento');

  let vT=0, cT=0, fT=0, pT=0, tT=0, eT=0;
  won.forEach(o => { const c = calc(o, state); vT += c.valorObra; cT += c.custo; fT += c.faturado; pT += c.producao; tT += c.tncTotal; eT += c.valorEfetivo; });
  const lT = round2(eT + tT - cT), mM = (eT + tT) ? lT / (eT + tT) : 0, sT = round2(vT - fT);

  let pV=0, pL=0;
  propostas.forEach(o => { const c = calc(o, state); pV += c.valorObra; pL += c.lucro; });

  return { won, propostas, vT, cT, fT, pT:round2(pT), tT:round2(tT), lT, mM, sT, pV, pL };
}

// ============================================================
// Fluxo financeiro no TEMPO (dashboard mensal/anual da carteira).
//   Produção = total de cada AUTO na sua data (trabalho medido).
//   Faturado = itens (adjudicação + autos) marcados FATURADO, na data da fatura
//              (fallback: data do próprio item se não houver data de fatura).
//   Custo    = custos LANÇADOS (datados).
//   Lucro do período = produção − custo. Os custos estimados (custoBase) não têm
//   data, por isso não entram aqui (só o que tem movimento datado).
// Devolve { anos:[…], porAno:{ano:{producao,faturado,custo,lucro}}, porMes:{…} }.
// ============================================================
export function fluxoCarteira(obras, state){
  const porMes = {};
  const slot = (k) => (porMes[k] = porMes[k] || { producao:0, faturado:0, custo:0 });
  obras.forEach(o => {
    const c = calc(o, state);
    const vendas = vendasDe(o, state);
    const temVendas = vendas.length > 0;
    // Produção: cada auto na sua data.
    c.autos.forEach(a => { if(a.data){ slot(String(a.data).slice(0,7)).producao += a.total || 0; } });
    // Faturado: das VENDAS carregadas (na sua data) quando existem; senão, os
    // itens marcados faturados no fluxo proforma/fatura (compat).
    if(temVendas){
      vendas.forEach(e => { if(e.data){ slot(String(e.data).slice(0,7)).faturado += e.valor || 0; } });
    } else {
      autosFaturaveis(o, state).forEach(a => {
        if(!a.faturado) return;
        const d = a.dataFatura || a.data; if(!d) return;
        slot(String(d).slice(0,7)).faturado += a.total || 0;
      });
      if(adjudFatEstado(o, state) === 'faturado'){
        const dd = fatDatas(o, state, ADJ_KEY).dataFatura || o.inicio;
        if(dd) slot(String(dd).slice(0,7)).faturado += adjudDe(o, state);
      }
    }
    // Custos lançados (datados) — EXCLUI vendas (essas são faturado, não custo).
    (state.custosData && state.custosData[o.codigo] || []).forEach(e => { if(e.categoria !== VENDA_CAT && e.data){ slot(String(e.data).slice(0,7)).custo += e.valor || 0; } });
    // Trabalho não contabilizado: conta como produção na sua data (nunca como faturado).
    tncDe(o, state).forEach(e => { if(e.data){ slot(String(e.data).slice(0,7)).producao += e.valor || 0; } });
  });
  Object.keys(porMes).forEach(k => { const m = porMes[k]; m.producao = round2(m.producao); m.faturado = round2(m.faturado); m.custo = round2(m.custo); m.lucro = round2(m.producao - m.custo); });

  const porAno = {};
  Object.keys(porMes).forEach(k => {
    const ano = k.slice(0,4); const m = porMes[k];
    const a = porAno[ano] = porAno[ano] || { producao:0, faturado:0, custo:0, lucro:0 };
    a.producao = round2(a.producao + m.producao); a.faturado = round2(a.faturado + m.faturado); a.custo = round2(a.custo + m.custo); a.lucro = round2(a.lucro + m.lucro);
  });
  const anos = Object.keys(porAno).sort();
  return { anos, porAno, porMes };
}
