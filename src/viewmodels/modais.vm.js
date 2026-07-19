// ============================================================
// viewmodels/modais.vm.js — VIEW-MODELS dos MODAIS
// buildAutoModal : drawer "Novo auto de medição" (medição por artigo).
// buildCustoModal: diálogo "Adicionar custo".
// Recebem: (obras, state, opts, on). Devolvem null se o modal está fechado.
//   on = handlers (modalDate, modalQtd, saveAuto, closeAuto,
//                  custoField, saveCusto, closeCusto, stopPropagation)
// ============================================================
import * as fmt from '../core/format.js';
import * as theme from '../core/theme.js';
import * as auth from '../core/auth.js';
import { autosDe, orcItensDe } from '../core/calc.js';

// ---------- Modal: Novo auto ----------
export function buildAutoModal(obras, state, opts, on){
  if(!state.autoModal) return null;
  const E = fmt.EUR, N3 = fmt.N3;
  const { obraId, date, qtds } = state.autoModal;
  const mObra = obras.find(o => o.codigo === obraId);
  // Itens do mapa de trabalhos EFETIVO (reflete edições ao auto base).
  const mItems = mObra ? orcItensDe(mObra, state) : [];

  // Quantidades já medidas em autos anteriores (semente + utilizador) — coluna "Ant.".
  // Conta TODOS os autos já existentes (artigos + trabalhos a mais) por _k.
  const mPrevAutos = mObra ? autosDe(mObra, state) : [];
  const prevQtds = {};
  mPrevAutos.forEach(a => {
    Object.entries(a.qtds || {}).forEach(([k,q]) => { prevQtds[k] = (prevQtds[k]||0) + (parseFloat(q)||0); });
    Object.entries(a.qtdsExtra || {}).forEach(([k,q]) => { prevQtds[k] = (prevQtds[k]||0) + (parseFloat(q)||0); });
  });

  let modalTotal = 0;
  const items = mItems.map(it => {
    // Título de divisão: linha organizadora, sem medição.
    if(it._sec) return { ehSec:true, ehItem:false, titulo:it.titulo || '' };
    const qt = parseFloat(qtds[it._k]) || 0; const total = qt * (it.vunit || 0); modalTotal += total;
    const medido = prevQtds[it._k] || 0;
    // Quanto falta medir (contratado − já medido). null = artigo sem quantidade contratada (sem limite).
    const resta = it.qt > 0 ? Math.max(0, Math.round((it.qt - medido) * 1000) / 1000) : null;
    const cheio = resta != null && resta <= 0.001;
    return {
      ehSec:false, ehItem:true,
      id:it.id || '—', desc:it.desc, uni:it.uni, qtContFmt:N3(it.qt), qtAntFmt:N3(medido),
      restaFmt: resta == null ? '∞' : N3(resta), cheio,
      qtThis:qt === 0 ? '' : String(qt), vunitFmt:E(it.vunit), totalFmt:total > 0.001 ? E(total) : '—',
      restaStyle:{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color: cheio ? '#1f9d57' : '#a4adbd', whiteSpace:'nowrap' },
      inputReadOnly: cheio,
      inputTitle: cheio ? 'Artigo já totalmente medido — sem quantidade por faturar' : '',
      inputStyle:{ width:'100%', border:'none', outline:'none', background:'transparent', fontFamily:"'IBM Plex Mono',monospace", fontSize:'14px', fontWeight:600, color: cheio ? '#b9c2d0' : '#16202e', padding:'7px 0', textAlign:'center', cursor: cheio ? 'not-allowed' : 'text' },
      totalStyle:{ fontFamily:"'IBM Plex Mono',monospace", fontVariantNumeric:'tabular-nums', fontWeight:total > 0 ? 600 : 400, fontSize:'13px', color:total > 0 ? '#16202e' : '#c0c8d2', textAlign:'right' },
      onQtd:(e) => on.modalQtd(it._k, e),
    };
  });

  // Auto de fecho: mede os trabalhos finais (pode ser 0) e conclui a obra.
  const ehFecho = !!state.autoModal.fecho;
  const podeGuardar = modalTotal > 0 || ehFecho;
  return {
    obraCode:obraId, obraTitulo:mObra ? mObra.titulo : '', date, onDate:(e) => on.modalDate(e),
    items, totalFmt:E(modalTotal),
    heading: ehFecho ? 'Auto de fecho' : 'Novo auto de medição',
    saveLabel: ehFecho ? 'Guardar e concluir obra' : 'Guardar auto',
    saveBtnStyle:{ border:'none', background:podeGuardar ? (ehFecho ? '#16273d' : '#2f6fed') : '#b9c2d0', color:'#fff', fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'13.5px', fontWeight:600, padding:'9px 22px', borderRadius:'8px', cursor:podeGuardar ? 'pointer' : 'default' },
    onSave:() => on.saveAuto(), onClose:() => on.closeAuto(),
  };
}

// ---------- Modal: Adicionar custo ----------
export function buildCustoModal(obras, state, opts, on){
  if(!state.custoModal) return null;
  const cm = state.custoModal;
  const valorNum = parseFloat(String(cm.valor).replace(',','.'));
  const canSave = !isNaN(valorNum) && valorNum > 0 && cm.descricao.length > 0;

  const cats = theme.CATS.map(cat => { const active = cm.categoria === cat;
    return { label:cat, active, onClick:() => on.custoField('categoria', cat),
      style:{ display:'inline-flex', alignItems:'center', padding:'6px 13px', borderRadius:'7px', cursor:'pointer', fontSize:'13px', fontWeight:active?600:500, border:'1.5px solid '+(active?theme.catCor(cat):'#dce1ea'), background:active?theme.catTint(cat):'#fff', color:active?theme.catCor(cat):'#56627a' } };
  });

  return {
    date:cm.data, onDate:(e) => on.custoField('data', e.target.value),
    descricao:cm.descricao, onDescricao:(e) => on.custoField('descricao', e.target.value),
    fornecedor:cm.fornecedor, onFornecedor:(e) => on.custoField('fornecedor', e.target.value),
    valor:cm.valor, onValor:(e) => on.custoField('valor', e.target.value), cats,
    saveBtnStyle:{ border:'none', background:canSave ? '#2f6fed' : '#b9c2d0', color:'#fff', fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'13.5px', fontWeight:600, padding:'9px 22px', borderRadius:'8px', cursor:canSave ? 'pointer' : 'default' },
    stopPropagation:(e) => e.stopPropagation(),
    onSave:() => on.saveCusto(), onClose:() => on.closeCusto(),
  };
}

// ---------- Modal: Nova obra ----------
export function buildObraModal(obras, state, opts, on){
  if(!state.obraModal) return null;
  const om = state.obraModal;
  const codigo = String(om.codigo || '').trim();
  const titulo = String(om.titulo || '').trim();
  // Código único (não pode colidir com obra existente) e título obrigatório.
  const codDup = codigo.length > 0 && obras.some(o => o.codigo.toLowerCase() === codigo.toLowerCase());
  const canSave = codigo.length > 0 && titulo.length > 0 && !codDup;

  const estados = ['Em execução', 'Adjudicada', 'Em orçamento', 'Concluída'];
  const estChips = estados.map(e => { const active = om.estado === e;
    return { label:e, onClick:() => on.obraField('estado', e),
      style:{ display:'inline-flex', alignItems:'center', padding:'7px 13px', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:active?600:500, border:'1.5px solid '+(active?theme.estadoCor(e):'#dce1ea'), background:active?theme.estadoTint(e):'#fff', color:active?theme.estadoCor(e):'#56627a', whiteSpace:'nowrap' } };
  });

  // Acessos: que utilizadores vêem a obra (admin/gestor veem sempre tudo).
  const ACC = (opts && opts.ACC) || '#2f6fed';
  const eu = (opts && opts.sessao) ? opts.sessao.user : null;
  const acessos = Array.isArray(om.acessos) ? om.acessos : [];
  const utils = auth.UTILIZADORES.filter(u => u.papel === 'utilizador');
  const acessosUI = utils.map(u => {
    const marcado = acessos.includes(u.user);
    const bloqueado = u.user === eu; // o criador fica sempre vinculado
    return { user:u.user, nome:u.nome, iniciais:auth.iniciais(u.nome), marcado, bloqueado,
      onToggle: bloqueado ? (() => {}) : (() => on.obraAcesso(u.user)),
      chipStyle:{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'6px 12px 6px 6px', borderRadius:'999px', cursor:bloqueado ? 'default' : 'pointer',
        border:'1px solid '+(marcado ? ACC : '#dce1ea'), background:marcado ? '#eef4ff' : '#fff', color:marcado ? '#16273d' : '#8a94a6', fontSize:'12.5px', fontWeight:marcado ? 600 : 500, fontFamily:"'IBM Plex Sans',sans-serif", opacity:bloqueado ? 0.9 : 1 },
      avatarStyle:{ width:'24px', height:'24px', borderRadius:'999px', flex:'none', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'IBM Plex Mono',monospace", fontWeight:600, fontSize:'10.5px', background:marcado ? ACC : '#e4e8ef', color:marcado ? '#fff' : '#8a94a6' } };
  });

  return {
    codigo:om.codigo, onCodigo:(e) => on.obraField('codigo', e.target.value),
    titulo:om.titulo, onTitulo:(e) => on.obraField('titulo', e.target.value),
    cliente:om.cliente, onCliente:(e) => on.obraField('cliente', e.target.value),
    data:om.inicio, onData:(e) => on.obraField('inicio', e.target.value),
    estChips,
    acessosUI, temUtilizadores: acessosUI.length > 0,
    codDup, codDupMsg: codDup ? 'Já existe uma obra com este código.' : '',
    saveBtnStyle:{ border:'none', background:canSave ? '#2f6fed' : '#b9c2d0', color:'#fff', fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'13.5px', fontWeight:600, padding:'9px 22px', borderRadius:'8px', cursor:canSave ? 'pointer' : 'default' },
    stopPropagation:(e) => e.stopPropagation(),
    onSave:() => on.saveObra(), onClose:() => on.closeObra(),
  };
}

// ---------- Modal: Código da fatura (proforma / fatura) ----------
export function buildCodigoModal(obras, state, opts, on){
  if(!state.codModal) return null;
  const cm = state.codModal;
  const cod = String(cm.cod || '').trim();
  const canSave = cod.length > 0;
  const ehFatura = cm.estado === 'faturado';
  return {
    titulo:cm.titulo, obraCodigo:cm.obraCodigo, itemLabel:cm.itemLabel, valorFmt:cm.valorFmt,
    heading: ehFatura ? 'Código da fatura' : 'Código da proforma',
    sub: ehFatura ? 'Introduza o número da fatura para a emitir.' : 'Introduza o número da proforma para a emitir.',
    placeholder: ehFatura ? 'Ex.: FT 2025/128' : 'Ex.: PF 2025/044',
    cod:cm.cod || '',
    onCod:(e) => on.codField(e.target.value),
    onKey:(e) => { if(e.key === 'Enter' && canSave) on.codConfirm(); },
    canSave,
    confirmLabel: ehFatura ? 'Emitir fatura' : 'Emitir proforma',
    saveBtnStyle:{ border:'none', background:canSave ? (ehFatura ? '#12895e' : '#2f6fed') : '#b9c2d0', color:'#fff', fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'13.5px', fontWeight:600, padding:'9px 22px', borderRadius:'8px', cursor:canSave ? 'pointer' : 'default' },
    stopPropagation:(e) => e.stopPropagation(),
    onSave:() => on.codConfirm(), onClose:() => on.codClose(),
  };
}
