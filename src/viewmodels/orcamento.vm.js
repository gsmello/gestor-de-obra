// ============================================================
// viewmodels/orcamento.vm.js — VIEW-MODEL do editor MAPA DE TRABALHOS
// Tabela editável de artigos + tabela de trabalhos a mais (extra) + totais
// + % de dedução de adjudicação. Tudo com handlers prontos.
// Recebe: (obra, state, opts, on). Usado dentro de buildDetalhe (separador Orçamento).
//   on = handlers (orcField, orcAdd, orcDel, setAdjudPct)
// ============================================================
import * as fmt from '../core/format.js';
import { orcamentoDe, adjudPctDe, orcTotais, adjudDe, adjudBloqueada } from '../core/calc.js';

// Handlers de arrastar-largar partilhados (pega de arrastar move a linha).
function dragDe(codigo, lista, it, on){
  return {
    onDragStart:(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', it._k); },
    onDragOver:(e)  => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; },
    onDrop:(e)      => { e.preventDefault(); const from = e.dataTransfer.getData('text/plain'); if(from) on.orcMover(codigo, lista, from, it._k); },
  };
}

function buildLinha(codigo, lista, it, on){
  const dnd = dragDe(codigo, lista, it, on);
  // Linha de TÍTULO de divisão (organiza o mapa; não conta em totais nem no auto).
  if(it._sec){
    return {
      _k:it._k, ehSec:true, ehItem:false, titulo:it.titulo || '',
      onTitulo:(e) => on.orcField(codigo, lista, it._k, 'titulo', e.target.value),
      onDel:() => on.orcDel(codigo, lista, it._k),
      ...dnd,
    };
  }
  const total = (it.qt || 0) * (it.vunit || 0);
  const numVal = (v) => (v === 0 || v === '' || v == null) ? '' : String(v);
  // Colar do Excel a partir desta célula (col = índice da coluna: 0=id..4=vunit).
  const paste = (col) => (e) => {
    const dt = e.clipboardData; const t = dt ? dt.getData('text') : '';
    if(t && /[\t\n]/.test(t)){ e.preventDefault(); on.orcColarEm(codigo, lista, it._k, col, t); }
  };
  return {
    _k:it._k, ehSec:false, ehItem:true, ...dnd,
    id:it.id, desc:it.desc, uni:it.uni,
    qtVal:numVal(it.qt), vunitVal:numVal(it.vunit),
    totalFmt: total > 0 ? fmt.EUR(total) : '—',
    onId:(e)   => on.orcField(codigo, lista, it._k, 'id', e.target.value),
    onDesc:(e) => on.orcField(codigo, lista, it._k, 'desc', e.target.value),
    onUni:(e)  => on.orcField(codigo, lista, it._k, 'uni', e.target.value),
    onQt:(e)   => on.orcField(codigo, lista, it._k, 'qt', e.target.value),
    onVunit:(e)=> on.orcField(codigo, lista, it._k, 'vunit', e.target.value),
    onPasteId:paste(0), onPasteDesc:paste(1), onPasteUni:paste(2), onPasteQt:paste(3), onPasteVunit:paste(4),
    onDel:()   => on.orcDel(codigo, lista, it._k),
  };
}

export function buildOrcamento(obra, state, opts, on){
  const orc = orcamentoDe(obra, state);
  const { orcT, extraT, total } = orcTotais(orc);
  const pct = adjudPctDe(obra, state);

  const imp = state.orcImport && state.orcImport.codigo === obra.codigo ? state.orcImport : null;

  return {
    artigos: orc.artigos.map(it => buildLinha(obra.codigo, 'artigos', it, on)),
    extra:   orc.extra.map(it => buildLinha(obra.codigo, 'extra', it, on)),
    hasExtra: orc.extra.length > 0,
    onAddArtigo:() => on.orcAdd(obra.codigo, 'artigos'),
    onAddTitulo:() => on.orcAddTitulo(obra.codigo, 'artigos'),
    onAddExtra:()  => on.orcAdd(obra.codigo, 'extra'),
    orcTFmt:   fmt.EUR(orcT),
    extraTFmt: fmt.EUR(extraT),
    valorFmt:  fmt.EUR(total),
    nArtigos: orc.artigos.length,
    nExtra: orc.extra.length,
    // % de dedução de adjudicação (editável). Mostrada como percentagem.
    adjudPctVal: pct ? String(Math.round(pct * 10000) / 100) : '',
    adjudDeducaoFmt: fmt.PCT1(pct),
    onAdjudPct:(e) => on.setAdjudPct(obra.codigo, e.target.value),
    // Adjudicação em valor (€) — par da %: editar um atualiza o outro.
    adjudValorVal: (() => { const a = adjudDe(obra, state); return a ? String(Math.round(a * 100) / 100) : ''; })(),
    onAdjudValor:(e) => on.setAdjudValor(obra.codigo, e.target.value),
    // Adjudicação FATURADA: a % / valor ficam bloqueados (não editáveis).
    adjudBloqueada: adjudBloqueada(obra, state),
    adjudReadOnly: adjudBloqueada(obra, state),
    // Arrastar/escolher um ficheiro Excel para preencher a tabela.
    onEscolherArquivo:(e) => { const f = e.target.files && e.target.files[0]; if(f) on.orcImportar(obra.codigo, f); e.target.value = ''; },
    onDropArquivo:(e) => {
      e.preventDefault();
      const z = e.currentTarget; z.style.background = '#eaf0fe'; z.style.borderColor = '#bcd0f7';
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if(f) on.orcImportar(obra.codigo, f);
    },
    onDragOver:(e) => { e.preventDefault(); const z = e.currentTarget; z.style.background = '#dde9ff'; z.style.borderColor = '#2f6fed'; },
    onDragLeave:(e) => { const z = e.currentTarget; z.style.background = '#eaf0fe'; z.style.borderColor = '#bcd0f7'; },
    importOk:  !!(imp && !imp.erro),
    importErro: !!(imp && imp.erro),
    importMsg: imp ? imp.msg : '',
  };
}
