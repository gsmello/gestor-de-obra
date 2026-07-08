// ============================================================
// core/auth.js — CONTAS, NÍVEIS DE ACESSO E SESSÃO (camada CORE)
// Único sítio onde vivem os utilizadores, os papéis e a sessão ativa.
// Sem UI, sem cálculos de obra. Toca apenas na chave 'obras_sessao_v1'.
//
// Papéis:
//   'admin'       -> tudo: aprova/reprova autos, apaga obras, fatura.
//   'gestor'      -> editor + fatura autos aprovados (proforma/fatura com
//                    código de fatura). Vê todas as obras. Não aprova nem apaga.
//   'utilizador'  -> editor: cria obras (fica vinculado), edita o auto base,
//                    cria autos/custos e envia autos para aprovação. Só vê as
//                    obras a que tem acesso; não fatura, não aprova, não apaga.
// Aprovar/reprovar é exclusivo de admin. Faturar é de admin e gestor.
// ============================================================

// Contas da aplicação. A palavra-passe inicial de cada conta é o próprio
// nome de utilizador (ex.: antonio / antonio). Alterar aqui para gerir contas.
export const UTILIZADORES = [
  { user:'antonio', nome:'António', papel:'admin',       pass:'antonio' },
  { user:'gabriel', nome:'Gabriel', papel:'utilizador',  pass:'gabriel' },
  { user:'silvia',  nome:'Sílvia',  papel:'gestor',      pass:'silvia'  },
  { user:'andre',   nome:'André',   papel:'utilizador',  pass:'andre'   },
  { user:'claudia', nome:'Cláudia', papel:'admin',       pass:'claudia' },
  { user:'adm',     nome:'Administrador', papel:'admin', pass:'adm'     },
];

const K_SESSAO = 'obras_sessao_v1';

// Normaliza o nome de utilizador escrito (sem espaços, minúsculas).
function _norm(s){ return String(s || '').trim().toLowerCase(); }

export function encontrar(user){
  const u = _norm(user);
  return UTILIZADORES.find(x => x.user === u) || null;
}

// Verifica credenciais. Devolve a sessão (sem a password) ou null.
export function autenticar(user, pass){
  const u = encontrar(user);
  if(!u) return null;
  if(String(pass) !== String(u.pass)) return null;
  return { user:u.user, nome:u.nome, papel:u.papel };
}

// Editar (criar obras, auto base, autos, custos…): qualquer sessão iniciada.
export function podeEditar(sessao){
  return !!sessao;
}

// Vê TODAS as obras (sem filtro de acessos): admin e gestor.
export function veTudo(sessao){
  return !!sessao && (sessao.papel === 'admin' || sessao.papel === 'gestor');
}

// Pode ver uma obra concreta: quem vê tudo, ou quem consta na lista de acessos.
export function podeVerObra(sessao, acessos){
  if(veTudo(sessao)) return true;
  return !!sessao && Array.isArray(acessos) && acessos.includes(sessao.user);
}

// Aprovar/reprovar autos e adjudicação: exclusivo de administradores.
export function podeAprovar(sessao){
  return !!sessao && sessao.papel === 'admin';
}

// Apagar uma obra inteira é a única ação reservada a administradores.
export function podeApagarObra(sessao){
  return !!sessao && sessao.papel === 'admin';
}

// Apagar um auto é reservado a administradores: o utilizador cria o auto,
// mas depois de criado só um admin o pode eliminar.
export function podeApagarAuto(sessao){
  return !!sessao && sessao.papel === 'admin';
}

// Faturar/anular a faturação de um auto: administradores e gestores.
export function podeFaturar(sessao){
  return !!sessao && (sessao.papel === 'admin' || sessao.papel === 'gestor');
}

export function papelLabel(papel){
  if(papel === 'admin')  return 'Administrador';
  if(papel === 'gestor') return 'Gestor';
  return 'Utilizador';
}

// Iniciais para o avatar (ex.: "Administrador" -> "AD", "Sílvia" -> "S").
export function iniciais(nome){
  const p = String(nome || '').trim().split(/\s+/);
  if(p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  return String(nome || '?').slice(0, 2).toUpperCase();
}

// ---- Sessão (persistida no navegador) ----
export function carregarSessao(){
  try {
    const r = localStorage.getItem(K_SESSAO);
    if(r){ const o = JSON.parse(r); if(o && o.user && encontrar(o.user)) return { user:o.user, nome:o.nome, papel:o.papel }; }
  } catch(e){}
  return null;
}
export function gravarSessao(s){ try { localStorage.setItem(K_SESSAO, JSON.stringify(s)); } catch(e){} }
export function limparSessao(){ try { localStorage.removeItem(K_SESSAO); } catch(e){} }
