// ============================================================
// core/storage.js — PERSISTÊNCIA (camada CORE)
// Lê/escreve no localStorage. Nada de UI nem cálculos.
// Coleções (indexadas por código de obra):
//   custoOverrides : { [codigo]: number }            custo manual simples
//   autosData      : { [codigo]: Auto[] }            autos criados pelo utilizador
//   custosData     : { [codigo]: LancamentoCusto[] } custos lançados
//   orcamentoData  : { [codigo]: {artigos,extra} }   mapa de trabalhos editado
//   adjudPctData   : { [codigo]: number }            % de dedução de adjudicação
//   obrasNovas     : ObraMeta[]                       obras criadas pelo utilizador
//   obrasDel       : string[]                         códigos de obras apagadas
// Usado por: SHELL (carregar no arranque + gravar nas ações).
// ============================================================

const K_OVER    = 'obras_custo_v1';
const K_AUTOS   = 'obras_autos_v1';
const K_CUSTOS  = 'obras_custos_v1';
const K_ORC     = 'obras_orcamento_v1';
const K_ADJ     = 'obras_adjudpct_v1';
const K_SEEDDEL = 'obras_autosseeddel_v1';
const K_NOVAS   = 'obras_novas_v1';
const K_DEL     = 'obras_del_v1';
const K_ESTADO   = 'obras_estado_v1';    // estado alterado pelo utilizador { [codigo]: estado }
const K_SEEDDATA = 'obras_autosseeddata_v1'; // datas de autos semente alteradas { [codigo]: { [origIdx]: {data} } }
const K_AUTOFAT  = 'obras_autofat_v1';    // faturação de autos { [codigo]: { [autoKey]: { estado, dataProforma, dataFatura, codProforma, codFatura } } }
const K_APROV    = 'obras_aprov_v1';      // aprovação de autos/adjud { [codigo]: { [autoKey]: { estado:'pendente'|'aprovado'|'reprovado', dataEnvio, dataDecisao, motivo, por } } }
const K_ACESSO   = 'obras_acesso_v1';     // acessos por obra { [codigo]: string[] de user } — vazio/ausente = só admin/gestor
const K_TNC      = 'obras_tnc_v1';        // trabalho não contabilizado { [codigo]: {id,data,descricao,valor}[] } — entra na produção/lucro, nunca na faturação
const K_FECHO    = 'obras_fecho_v1';      // auto de fecho { [codigo]: { data } } — conclui a obra e acerta a adjudicação do trabalho não executado

function _loadArr(k){
  try { const r = localStorage.getItem(k); if(r){ const o = JSON.parse(r); if(Array.isArray(o)) return o; } }
  catch(e){}
  return [];
}

function _load(k){
  try { const r = localStorage.getItem(k); if(r){ const o = JSON.parse(r); if(o && typeof o === 'object') return o; } }
  catch(e){}
  return {};
}
function _save(k, o){
  try { localStorage.setItem(k, JSON.stringify(o)); } catch(e){}
}

export function loadAll(){
  return {
    custoOverrides:_load(K_OVER),
    autosData:_load(K_AUTOS),
    custosData:_load(K_CUSTOS),
    orcamentoData:_load(K_ORC),
    adjudPctData:_load(K_ADJ),
    autosSeedDel:_load(K_SEEDDEL),
    autosSeedData:_load(K_SEEDDATA),
    estadoData:_load(K_ESTADO),
    autoFatData:_load(K_AUTOFAT),
    autoAprovData:_load(K_APROV),
    obrasAcessoData:_load(K_ACESSO),
    tncData:_load(K_TNC),
    fechoData:_load(K_FECHO),
    obrasNovas:_loadArr(K_NOVAS),
    obrasDel:_loadArr(K_DEL),
  };
}
export function saveOverrides(o){ _save(K_OVER, o); }
export function saveAutos(o){ _save(K_AUTOS, o); }
export function saveCustos(o){ _save(K_CUSTOS, o); }
export function saveOrcamento(o){ _save(K_ORC, o); }
export function saveAdjudPct(o){ _save(K_ADJ, o); }
export function saveAutosSeedDel(o){ _save(K_SEEDDEL, o); }
export function saveObrasNovas(o){ _save(K_NOVAS, o); }
export function saveObrasDel(o){ _save(K_DEL, o); }
export function saveEstado(o){ _save(K_ESTADO, o); }
export function saveAutosSeedData(o){ _save(K_SEEDDATA, o); }
export function saveAutoFat(o){ _save(K_AUTOFAT, o); }
export function saveAprov(o){ _save(K_APROV, o); }
export function saveAcesso(o){ _save(K_ACESSO, o); }
export function saveTNC(o){ _save(K_TNC, o); }
export function saveFecho(o){ _save(K_FECHO, o); }
