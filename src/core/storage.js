// ============================================================
// core/storage.js — PERSISTÊNCIA PARTILHADA (camada CORE)
// Lê/escreve na Realtime Database do Firebase, num nó partilhado único
// (`/dados`). TODA a equipa vê os mesmos dados. Sem UI nem cálculos.
//
// Antes isto usava o localStorage (dados isolados por navegador). Agora os
// dados vivem na nuvem e são partilhados + ao vivo (ver `subscribe`).
//
// Coleções (indexadas por código de obra), iguais às de antes:
//   custoOverrides, autosData, custosData, orcamentoData, adjudPctData,
//   autosSeedDel, autosSeedData, estadoData, autoFatData, autoAprovData,
//   obrasAcessoData, tncData, fechoData   (objetos)
//   obrasNovas, obrasDel                  (arrays)
// Usado por: SHELL (subscreve no arranque + grava nas ações).
// ============================================================
import { db, ref, get, set, onValue } from './firebase.js';

const BASE = 'dados';

// Chaves dos nós (mantidas iguais às antigas chaves de localStorage).
const K = {
  OVER:'obras_custo_v1', AUTOS:'obras_autos_v1', CUSTOS:'obras_custos_v1', ORC:'obras_orcamento_v1',
  ADJ:'obras_adjudpct_v1', SEEDDEL:'obras_autosseeddel_v1', SEEDDATA:'obras_autosseeddata_v1',
  ESTADO:'obras_estado_v1', AUTOFAT:'obras_autofat_v1', APROV:'obras_aprov_v1', ACESSO:'obras_acesso_v1',
  TNC:'obras_tnc_v1', FECHO:'obras_fecho_v1', NOVAS:'obras_novas_v1', DEL:'obras_del_v1',
};

// Coleções que são OBJETOS (campo do state -> nó na base de dados).
const COLS = {
  custoOverrides:K.OVER, autosData:K.AUTOS, custosData:K.CUSTOS, orcamentoData:K.ORC,
  adjudPctData:K.ADJ, autosSeedDel:K.SEEDDEL, autosSeedData:K.SEEDDATA, estadoData:K.ESTADO,
  autoFatData:K.AUTOFAT, autoAprovData:K.APROV, obrasAcessoData:K.ACESSO, tncData:K.TNC, fechoData:K.FECHO,
};
// Coleções que são ARRAYS.
const ARRS = { obrasNovas:K.NOVAS, obrasDel:K.DEL };

const _obj = (v) => (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
// A Realtime Database pode devolver um array denso como array, ou (raro) como
// objeto com índices. Coage sempre para array.
const _arr = (v) => Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.values(v) : []);

// Constrói o objeto de state a partir de um snapshot do nó `/dados`.
function _montar(v){
  const out = {};
  for(const f in COLS) out[f] = _obj(v[COLS[f]]);
  for(const f in ARRS) out[f] = _arr(v[ARRS[f]]);
  return out;
}

// Leitura única de TODAS as coleções (Promise). Mantida por conveniência; o
// shell usa `subscribe` (que também faz o 1.º carregamento).
export async function loadAll(){
  const snap = await get(ref(db, BASE));
  return _montar(snap.val() || {});
}

// Subscreve as alterações do nó partilhado: chama onData(coleções) já com os
// dados atuais e outra vez sempre que qualquer coisa muda (atualização AO VIVO).
// Devolve uma função para cancelar a subscrição.
export function subscribe(onData){
  return onValue(ref(db, BASE), (snap) => onData(_montar(snap.val() || {})));
}

// Grava um nó (substitui o conteúdo todo, como o localStorage fazia). Escrita
// assíncrona em segundo plano; a UI já atualizou via setState. Falhas de rede
// só registam no log — não rebentam a app.
function _save(k, o){
  return set(ref(db, BASE + '/' + k), o).catch(e => console.error('[storage] falha ao gravar', k, e));
}

export function saveOverrides(o){ return _save(K.OVER, o); }
export function saveAutos(o){ return _save(K.AUTOS, o); }
export function saveCustos(o){ return _save(K.CUSTOS, o); }
export function saveOrcamento(o){ return _save(K.ORC, o); }
export function saveAdjudPct(o){ return _save(K.ADJ, o); }
export function saveAutosSeedDel(o){ return _save(K.SEEDDEL, o); }
export function saveObrasNovas(o){ return _save(K.NOVAS, o); }
export function saveObrasDel(o){ return _save(K.DEL, o); }
export function saveEstado(o){ return _save(K.ESTADO, o); }
export function saveAutosSeedData(o){ return _save(K.SEEDDATA, o); }
export function saveAutoFat(o){ return _save(K.AUTOFAT, o); }
export function saveAprov(o){ return _save(K.APROV, o); }
export function saveAcesso(o){ return _save(K.ACESSO, o); }
export function saveTNC(o){ return _save(K.TNC, o); }
export function saveFecho(o){ return _save(K.FECHO, o); }
