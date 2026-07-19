// ============================================================
// core/auth.js — CONTAS, NÍVEIS DE ACESSO E SESSÃO (camada CORE)
// O login é feito no FIREBASE (Email/Password). Aqui fica só o mapa de quem é
// quem (nome, papel, email) e as regras de permissão. As PALAVRAS-PASSE já NÃO
// estão no código — vivem no Firebase Authentication.
//
// Papéis:
//   'admin'       -> tudo: aprova/reprova autos, apaga obras, fatura.
//   'gestor'      -> editor + fatura autos aprovados. Vê todas as obras.
//   'utilizador'  -> editor: cria obras (fica vinculado), cria autos/custos e
//                    envia para aprovação. Só vê as obras a que tem acesso.
// ============================================================
import { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from './firebase.js';

// Contas da app. Cada uma liga a um email real do Firebase. Para gerir contas:
// criar/alterar no Firebase Authentication E manter este mapa em sincronia.
export const UTILIZADORES = [
  { user:'antonio', nome:'António',       papel:'admin',       email:'antonio.barbosa@maw.pt' },
  { user:'gabriel', nome:'Gabriel',       papel:'utilizador',  email:'gabriel.mello@maw.pt'  },
  { user:'silvia',  nome:'Sílvia',        papel:'gestor',      email:'silvia.oliveira@maw.pt' },
  { user:'andre',   nome:'André',         papel:'utilizador',  email:'andre.mendes@maw.pt'   },
  { user:'adm',     nome:'Administrador', papel:'admin',       email:'adm@gestor-obra.com'   },
];

function _norm(s){ return String(s || '').trim().toLowerCase(); }

export function encontrar(user){
  const u = _norm(user);
  return UTILIZADORES.find(x => x.user === u) || null;
}
function _porEmail(email){
  const e = _norm(email);
  return UTILIZADORES.find(x => _norm(x.email) === e) || null;
}
function _sessaoDe(u){ return u ? { user:u.user, nome:u.nome, papel:u.papel } : null; }

// Login: recebe o username do cartão + a palavra-passe, traduz para o email e
// autentica no Firebase. Devolve a sessão (sem password) ou null se falhar.
export async function autenticar(user, pass){
  const u = encontrar(user);
  if(!u) return null;
  try {
    await signInWithEmailAndPassword(auth, u.email, String(pass));
    return _sessaoDe(u);
  } catch(e){
    return null;
  }
}

// Observa o estado de login do Firebase (persiste entre recarregamentos, sem
// tocar em localStorage). Chama cb(sessao|null) no arranque e a cada mudança.
// Devolve uma função para cancelar a observação.
export function observarSessao(cb){
  return onAuthStateChanged(auth, (fbUser) => {
    cb(fbUser ? _sessaoDe(_porEmail(fbUser.email)) : null);
  });
}

export function sair(){ return signOut(auth); }

// ---- Permissões (inalteradas) ----
export function podeEditar(sessao){ return !!sessao; }
export function veTudo(sessao){ return !!sessao && (sessao.papel === 'admin' || sessao.papel === 'gestor'); }
export function podeVerObra(sessao, acessos){
  if(veTudo(sessao)) return true;
  return !!sessao && Array.isArray(acessos) && acessos.includes(sessao.user);
}
export function podeAprovar(sessao){ return !!sessao && sessao.papel === 'admin'; }
export function podeApagarObra(sessao){ return !!sessao && sessao.papel === 'admin'; }
export function podeApagarAuto(sessao){ return !!sessao && sessao.papel === 'admin'; }
export function podeFaturar(sessao){ return !!sessao && (sessao.papel === 'admin' || sessao.papel === 'gestor'); }

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
