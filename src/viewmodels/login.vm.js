// ============================================================
// viewmodels/login.vm.js — VIEW-MODEL do ecrã de LOGIN
// Prepara as props do Login.dc.html a partir do estado de autenticação.
// Recebe: (state, opts, on). Não calcula obras.
//   state.loginUser / state.loginPass / state.loginErro
//   opts = { ACC }
//   on   = { loginUser, loginPass, entrar }
// ============================================================
import * as auth from '../core/auth.js';

export function buildLogin(state, opts, on){
  const ACC = opts.ACC || '#2f6fed';
  const userVal = state.loginUser || '';
  const passVal = state.loginPass || '';

  // Cartões de conta (prefillam o nome de utilizador ao clicar).
  const contas = auth.UTILIZADORES.map(u => {
    const ativo = auth.encontrar(userVal) && auth.encontrar(userVal).user === u.user;
    const admin = u.papel !== 'utilizador';
    return {
      user:u.user, nome:u.nome, iniciais:auth.iniciais(u.nome),
      papelLabel:auth.papelLabel(u.papel),
      onClick:() => on.loginUser(u.user),
      avatarStyle:{ width:'34px', height:'34px', borderRadius:'9px', flex:'none', display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:"'IBM Plex Mono',monospace", fontWeight:600, fontSize:'12.5px',
        background:admin ? ACC : '#e4e8ef', color:admin ? '#fff' : '#56627a' },
      rowStyle:{ display:'flex', alignItems:'center', gap:'11px', padding:'9px 11px', borderRadius:'10px', cursor:'pointer', textAlign:'left', width:'100%',
        border:'1px solid '+(ativo ? '#16273d' : '#e4e8ef'), background:ativo ? '#f2f6ff' : '#fff' },
      nomeStyle:{ fontSize:'13.5px', fontWeight:600, color:'#16202e' },
      papelStyle:{ fontSize:'11px', fontWeight:600, letterSpacing:'.03em', textTransform:'uppercase',
        color:admin ? ACC : '#8a94a6', fontFamily:"'IBM Plex Sans',sans-serif" },
    };
  });

  return {
    contas,
    userVal, passVal,
    erro: state.loginErro || '',
    temErro: !!state.loginErro,
    entrarStyle:{ background:ACC },
    onUser:(e) => on.loginUser(e.target.value),
    onPass:(e) => on.loginPass(e.target.value),
    onEntrar:() => on.entrar(),
    onKey:(e) => { if(e.key === 'Enter') on.entrar(); },
  };
}
