// ============================================================
// data/obras.seed.js — DADOS DE BASE (camada DADOS)
// Fonte única das obras de exemplo, do mapa de trabalhos (orçamento) e
// dos autos semente. SÓ dados + geração determinística. Sem UI.
//
// MODELO POR OBRA
//   orcamento = { artigos:[Item], extra:[Item] }   ← Item editável pelo utilizador
//   Item      = { _k, id, desc, uni, qt, vunit }    ← _k é a chave estável p/ autos
//   seedAutos = [ { n, data, qtds, qtdsExtra } ]     ← quantidades medidas por artigo
//   adjudPctDefault                                  ← dedução de adjudicação (= adjud/orçamento)
//
// O Valor da obra = soma(artigos) + soma(extra). Editar a lista recalcula tudo.
// Para acrescentar/editar obras: mexer APENAS neste ficheiro.
// ============================================================

function round2(x){ return Math.round(x * 100) / 100; }
function addMonths(iso, n){ const d = new Date((iso || '2025-01-01') + 'T00:00:00'); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0,10); }
function soma(items){ return round2(items.reduce((s,it) => s + it.qt * it.vunit, 0)); }

// ---------- Obras (metadados) ----------
//   orc/mais : usados só para GERAR o orçamento por defeito (artigos somam orc, extra soma mais)
//   adjud    : valor adjudicado (define a % de dedução = adjud/orc)
//   custo    : custo base estimado
//   detailed : usa o mapa de trabalhos real (obra-piloto 2025-0010)
//   gen      : { progress 0..1, count } para gerar autos semente automaticamente
const OBRAS_RAW = [
  { codigo:'2025-0010', titulo:'Substituição de coluna de drenagem', cliente:'Condomínio Largo António Sérgio 2', local:'Lisboa', estado:'Em execução', inicio:'2025-07-01', orc:28840, mais:640, adjud:9171.12, custo:21200, detailed:true },
  { codigo:'2025-0007', titulo:'Reabilitação de fachada principal', cliente:'Condomínio Rua Garrett 14', local:'Lisboa', estado:'Concluída', inicio:'2025-03-10', orc:61500, mais:2800, adjud:12300, custo:47600, gen:{progress:1,count:4} },
  { codigo:'2025-0014', titulo:'Remodelação de instalações sanitárias', cliente:'Edifício Av. da República 88', local:'Lisboa', estado:'Em execução', inicio:'2025-09-05', orc:41750, mais:0, adjud:6262.5, custo:33100, gen:{progress:0.55,count:3} },
  { codigo:'2024-0021', titulo:'Impermeabilização de cobertura', cliente:'Condomínio Rua do Sol 3', local:'Almada', estado:'Concluída', inicio:'2024-11-04', orc:18600, mais:0, adjud:3720, custo:12450, gen:{progress:1,count:3} },
  { codigo:'2025-0019', titulo:'Substituição de rede de águas', cliente:'Prédio Rua de Campolide 120', local:'Lisboa', estado:'Adjudicada', inicio:'2026-01-12', orc:53200, mais:0, adjud:5320, custo:41800, gen:{progress:0,count:0} },
  { codigo:'2025-0023', titulo:'Reforço estrutural de laje', cliente:'Moradia Estrada da Luz 45', local:'Sintra', estado:'Em orçamento', inicio:'', orc:36900, mais:0, adjud:0, custo:28500, gen:{progress:0,count:0} },
  { codigo:'2024-0033', titulo:'Construção de muro de suporte', cliente:'Quinta da Bela Vista', local:'Sintra', estado:'Concluída', inicio:'2024-06-03', orc:27400, mais:0, adjud:5480, custo:26900, gen:{progress:1,count:3} },
  { codigo:'2025-0003', titulo:'Pintura e isolamento de empena', cliente:'Condomínio Rua Maria Pia 210', local:'Lisboa', estado:'Concluída', inicio:'2025-02-17', orc:22300, mais:0, adjud:4460, custo:15100, gen:{progress:1,count:2} },
];

// ---------- Mapa de trabalhos real da obra-piloto (do Excel) ----------
const ART_2025_0010 = [
  {id:'1.1', desc:'Trabalhos de preparação, proteção e estaleiro', uni:'vg', qt:1, vunit:4249.90},
  {id:'2.1', desc:'Desmontagem cuidada com corte de tubagem existente', uni:'m', qt:26, vunit:16.00},
  {id:'2.2', desc:'Desmontagem de sanita com cisterna', uni:'Ud', qt:12, vunit:56.75},
  {id:'2.3', desc:'Abertura de vãos em corete para passagem de tubagem', uni:'m', qt:19.2, vunit:97.21},
  {id:'2.4', desc:'Fecho temporário das aberturas', uni:'vg', qt:1, vunit:3187.58},
  {id:'3.1', desc:'Tubo de queda interior da rede de drenagem', uni:'m', qt:19.2, vunit:76.63},
  {id:'3.2', desc:'Ramal de descarga, encastrado', uni:'m', qt:12, vunit:269.69},
  {id:'3.3', desc:'Repercussão por área construída', uni:'m²', qt:38, vunit:32.71},
  {id:'4.1', desc:'Ligação da coluna ao coletor predial', uni:'Ud', qt:1, vunit:749.45},
  {id:'4.2', desc:'Reabilitação da caixa existente', uni:'vg', qt:1, vunit:944.06},
  {id:'4.3', desc:'Abertura de vala sob pavimento', uni:'m', qt:4, vunit:755.25},
  {id:'5.1', desc:'Pavimento interior de peças cerâmicas', uni:'m²', qt:12, vunit:49.97},
  {id:'5.2', desc:'Revestimento interior com peças cerâmicas', uni:'m²', qt:34.2, vunit:48.88},
  {id:'5.3', desc:'Parede meeira simples, de 7 cm', uni:'m²', qt:34.2, vunit:36.88},
  {id:'5.4', desc:'Formação de revestimento contínuo', uni:'m²', qt:34.2, vunit:53.00},
  {id:'5.5', desc:'Reparação de laje de betão', uni:'m²', qt:6, vunit:260.18},
  {id:'5.6', desc:'Sanita de porcelana sanitária', uni:'Ud', qt:10, vunit:86.77},
];
const EXTRA_2025_0010 = [
  {id:'MTE', desc:'Alteração de traçado da rede (trabalho a mais)', uni:'vg', qt:1, vunit:640.00},
];
// Autos reais (quantidades medidas por artigo) — reproduzem o Excel ao cêntimo.
const AUTOS_2025_0010 = [
  { n:1, data:'2025-07-28', qtds:{'1.1':0.5,'2.2':12,'2.3':19.2,'2.4':1,'3.2':1,'4.1':1,'4.3':2}, qtdsExtra:{'MTE':1} },
  { n:2, data:'2025-08-27', qtds:{'1.1':0.3,'2.1':26,'3.1':19.2,'3.2':11,'3.3':34,'4.2':1,'4.3':2,'5.1':12,'5.2':20,'5.3':20,'5.4':20,'5.5':6,'5.6':3}, qtdsExtra:{} },
];

// ---------- Geradores (obras sem mapa manual) ----------
function genArtigos(orc){
  const tpl = [
    ['1.1','Trabalhos preparatórios, estaleiro e proteções','vg',0.08,null],
    ['2.1','Demolições, remoções e movimentação de terras','vg',0.12,null],
    ['2.2','Alvenarias, panos de parede e elementos de betão','m²',0.16,46],
    ['3.1','Rede de abastecimento de águas e drenagem','vg',0.14,null],
    ['3.2','Instalação elétrica, ITED e quadros','vg',0.10,null],
    ['4.1','Revestimentos cerâmicos, cantarias e pavimentos','m²',0.18,38],
    ['5.1','Pinturas, barramentos e isolamentos','m²',0.12,16],
    ['6.1','Ensaios, limpeza final e assistência técnica','vg',0.10,null],
  ];
  const items = []; let acc = 0;
  tpl.forEach((t,i) => {
    const last = i === tpl.length - 1;
    let total = last ? round2(orc - acc) : round2(orc * t[3]);
    let quant, vunit;
    if(t[4] && !last){ vunit = t[4]; quant = Math.round(total / t[4] * 10) / 10; total = round2(quant * vunit); }
    else { quant = 1; vunit = round2(total); }
    acc = round2(acc + total);
    items.push({ id:t[0], desc:t[1], uni:t[2], qt:quant, vunit });
  });
  return items;
}
function genExtra(mais){
  if(!mais || mais <= 0) return [];
  return [
    {id:'MTE1', desc:'Trabalhos a mais — alterações solicitadas pelo cliente', uni:'vg', qt:1, vunit:round2(mais*0.6)},
    {id:'MTE2', desc:'Trabalhos a mais — imprevistos detetados em obra', uni:'vg', qt:1, vunit:round2(mais*0.4)},
  ];
}
function genSeedAutos(meta, artigos, extra){
  const n = meta.gen ? meta.gen.count : 0; if(!n) return [];
  const prog = meta.gen.progress != null ? meta.gen.progress : 1;
  const autos = [];
  for(let i=0;i<n;i++){
    const qtds = {}, qtdsExtra = {};
    artigos.forEach(a => { qtds[a._k] = round2(a.qt * prog / n); });
    extra.forEach(e => { qtdsExtra[e._k] = round2(e.qt * prog / n); });
    autos.push({ n:i+1, data:addMonths(meta.inicio, i+1), qtds, qtdsExtra });
  }
  return autos;
}

// ---------- Construção das obras ----------
// _k (chave estável para os autos) = id do artigo na semente; itens novos do
// utilizador recebem um _k próprio gerado em runtime (ver core/calc + shell).
function withKeys(items){ return items.map(it => Object.assign({ _k:it.id }, it)); }

function buildObra(meta){
  const artigos = withKeys(meta.detailed ? ART_2025_0010 : genArtigos(meta.orc));
  const extra   = withKeys(meta.detailed ? EXTRA_2025_0010 : genExtra(meta.mais));
  const orcamento = { artigos, extra };
  const seedAutos = meta.detailed ? AUTOS_2025_0010 : genSeedAutos(meta, artigos, extra);
  const orcT = soma(artigos);
  const adjudPctDefault = orcT ? round2((meta.adjud / orcT) * 10000) / 10000 : 0;
  return {
    codigo:meta.codigo, titulo:meta.titulo, cliente:meta.cliente, local:meta.local, estado:meta.estado, inicio:meta.inicio,
    adjud:meta.adjud, custoBase:meta.custo,
    orcamento, seedAutos, adjudPctDefault,
    valorObraDefault: round2(orcT + soma(extra)),
  };
}

export const OBRAS = OBRAS_RAW.map(buildObra);

// Itens do mapa de trabalhos de uma obra (artigos + extra), por código.
// Usado pelo modal "Novo auto" para listar os artigos a medir.
const _ORC_INDEX = {};
OBRAS.forEach(o => { _ORC_INDEX[o.codigo] = [...o.orcamento.artigos, ...o.orcamento.extra]; });
export function orcItems(codigo){ return _ORC_INDEX[codigo] || []; }

// ---------- Obras criadas pelo utilizador ----------
// Constrói uma obra com a MESMA forma das da semente, a partir dos campos
// recolhidos no modal "Nova obra" (codigo, titulo, cliente, inicio, estado).
// Começa sem mapa de trabalhos e sem autos — preenche-se depois no detalhe.
export function buildObraUtilizador(meta){
  return {
    codigo: meta.codigo, titulo: meta.titulo, cliente: meta.cliente, local: meta.local || '',
    estado: meta.estado || 'Em execução', inicio: meta.inicio || new Date().toISOString().slice(0,10),
    adjud: 0, custoBase: 0,
    orcamento: { artigos: [], extra: [] }, seedAutos: [],
    adjudPctDefault: 0, valorObraDefault: 0,
    _user: true,
  };
}

// Sugere o próximo código de obra (ANO-NNNN) a partir das existentes.
export function proximoCodigo(codigos){
  const ano = new Date().getFullYear();
  let max = 0;
  (codigos || []).forEach(c => { const m = /(\d{4})-(\d{1,4})/.exec(String(c)); if(m && +m[1] === ano){ max = Math.max(max, +m[2]); } });
  return ano + '-' + String(max + 1).padStart(4, '0');
}
