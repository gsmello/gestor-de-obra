// ============================================================
// src/index.js — BARRIL / API PÚBLICA
// Ponto único de entrada que o SHELL importa dinamicamente:
//   const M = await import('./src/index.js');
// Reexporta dados, núcleo e construtores de view-model.
// ============================================================
export { OBRAS, orcItems, buildObraUtilizador, proximoCodigo } from './data/obras.seed.js';
export * as fmt     from './core/format.js';
export * as theme   from './core/theme.js';
export * as calc    from './core/calc.js';
export * as storage from './core/storage.js';
export * as xlsx    from './core/xlsx.js';
export * as auth    from './core/auth.js';

export { buildLogin }     from './viewmodels/login.vm.js';
export { buildSidebar }   from './viewmodels/sidebar.vm.js';
export { buildCarteira }  from './viewmodels/carteira.vm.js';
export { buildFaturacao } from './viewmodels/faturacao.vm.js';
export { buildAprovacao } from './viewmodels/aprovacao.vm.js';
export { buildDetalhe }   from './viewmodels/detalhe.vm.js';
export { buildAutoModal, buildCustoModal, buildObraModal, buildCodigoModal } from './viewmodels/modais.vm.js';
export { buildAutoFolha } from './viewmodels/autopdf.vm.js';
