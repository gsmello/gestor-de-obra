// ============================================================
// core/format.js — FORMATADORES (camada CORE)
// Apenas converte números/datas em texto pt-PT. Sem lógica de negócio.
// Usado por: viewmodels/*. Editar aqui muda a formatação em todo o lado.
// ============================================================

const _EUR  = new Intl.NumberFormat('pt-PT', { style:'currency', currency:'EUR', minimumFractionDigits:2, maximumFractionDigits:2 });
const _EUR0 = new Intl.NumberFormat('pt-PT', { style:'currency', currency:'EUR', maximumFractionDigits:0 });
const _PCT1 = new Intl.NumberFormat('pt-PT', { style:'percent', minimumFractionDigits:1, maximumFractionDigits:1 });

// Euro com cêntimos · ex: 28.840,00 €
export const EUR  = (x) => _EUR.format(x || 0);
// Euro arredondado · ex: 28.840 €
export const EUR0 = (x) => _EUR0.format(x || 0);
// Percentagem com 1 casa · ex: 31,8 %
export const PCT1 = (x) => _PCT1.format(x || 0);
// Número com até 3 casas (quantidades de medição) · ex: 24,5
export const N3   = (x) => Number(x).toLocaleString('pt-PT', { maximumFractionDigits:3 });

// Data ISO (yyyy-mm-dd) -> dd/mm/yyyy. Vazio -> "—".
export function fmtDate(iso){
  if(!iso) return '—';
  const p = iso.split('-');
  return p[2] + '/' + p[1] + '/' + p[0];
}
