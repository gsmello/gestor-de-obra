// ============================================================
// core/theme.js — CORES E TOKENS VISUAIS (camada CORE)
// Mapeia conceitos de negócio (estado, categoria, margem, acento) para cores.
// É o ÚNICO sítio onde se decidem cores semânticas. Sem markup.
// Usado por: viewmodels/*.
// ============================================================

// Categorias de custo de obra (ordem usada em gráficos e chips).
export const CATS = ['Materiais', 'Mão de obra', 'Subempreitadas', 'Equipamentos', 'Outros'];

// Cor de acento (prop "acentoCor" do shell) -> hex.
export const ACCENTS = { Azul:'#2f6fed', Verde:'#1f9e6b', 'Ardósia':'#52607a' };
export function accent(name){ return ACCENTS[name] || '#2f6fed'; }

// Estado da obra -> cor de texto / cor de fundo (tint).
export function estadoCor(e){
  if(e === 'Concluída')    return '#12895e';
  if(e === 'Em execução')  return '#2f6fed';
  if(e === 'Adjudicada')   return '#c77d1a';
  return '#8a94a6';
}
export function estadoTint(e){
  if(e === 'Concluída')    return '#e4f3ec';
  if(e === 'Em execução')  return '#eaf0fe';
  if(e === 'Adjudicada')   return '#f7eddb';
  return '#eef1f5';
}

// Margem (0..1) -> cor (verde bom / âmbar médio / vermelho baixo).
export function margemCor(m){
  if(m >= 0.18) return '#12895e';
  if(m >= 0.08) return '#c77d1a';
  return '#cf4b3a';
}

// Categoria de custo -> cor / tint. 'Venda' (receita/faturado) usa verde e NÃO
// pertence às CATS de custo — só recebe cor para o tag da linha renderizar.
export function catCor(c){
  const m = { 'Materiais':'#2f6fed', 'Mão de obra':'#12895e', 'Subempreitadas':'#c77d1a', 'Equipamentos':'#7c4fcf', 'Outros':'#56627a', 'Venda':'#12895e' };
  return m[c] || '#56627a';
}
export function catTint(c){
  const m = { 'Materiais':'#eaf0fe', 'Mão de obra':'#e4f3ec', 'Subempreitadas':'#fef3e2', 'Equipamentos':'#f0edf8', 'Outros':'#eef1f5', 'Venda':'#e4f3ec' };
  return m[c] || '#eef1f5';
}

// Estilo reutilizável para valores numéricos grandes (KPIs).
export function numStyle(color, size){
  return { fontFamily:"'IBM Plex Mono',monospace", fontVariantNumeric:'tabular-nums', fontWeight:600, fontSize:size, color, letterSpacing:'-.01em', marginTop:'7px' };
}
