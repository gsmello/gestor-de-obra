// ============================================================
// obras-data.js — fonte única de dados e cálculos
// Carregado por Carteira / Obra / Auto via import() dinâmico.
// Editar AQUI muda os dados em todas as páginas.
// ============================================================

// ---------- Metadados das obras ----------
const META = [
  {codigo:'2025-0010', titulo:'Substituição de coluna de drenagem', cliente:'Condomínio Largo António Sérgio 2', local:'Lisboa', estado:'Em execução', inicio:'2025-07-01', orc:28840, extraVal:640, adjudPct:0.25, custoBase:21200, progress:0.75, nAutos:3, detailed:true},
  {codigo:'2025-0007', titulo:'Reabilitação de fachada principal', cliente:'Condomínio Rua Garrett 14', local:'Lisboa', estado:'Concluída', inicio:'2025-03-10', orc:61500, extraVal:2800, adjudPct:0.20, custoBase:47600, progress:1, nAutos:4},
  {codigo:'2025-0014', titulo:'Remodelação de instalações sanitárias', cliente:'Edifício Av. da República 88', local:'Lisboa', estado:'Em execução', inicio:'2025-09-05', orc:41750, extraVal:0, adjudPct:0.15, custoBase:33100, progress:0.55, nAutos:3},
  {codigo:'2024-0021', titulo:'Impermeabilização de cobertura', cliente:'Condomínio Rua do Sol 3', local:'Almada', estado:'Concluída', inicio:'2024-11-04', orc:18600, extraVal:0, adjudPct:0.20, custoBase:12450, progress:1, nAutos:3},
  {codigo:'2025-0019', titulo:'Substituição de rede de águas', cliente:'Prédio Rua de Campolide 120', local:'Lisboa', estado:'Adjudicada', inicio:'2026-01-12', orc:53200, extraVal:0, adjudPct:0.10, custoBase:41800, progress:0, nAutos:0},
  {codigo:'2025-0023', titulo:'Reforço estrutural de laje', cliente:'Moradia Estrada da Luz 45', local:'Sintra', estado:'Em orçamento', inicio:'', orc:36900, extraVal:0, adjudPct:0, custoBase:28500, progress:0, nAutos:0},
  {codigo:'2024-0033', titulo:'Construção de muro de suporte', cliente:'Quinta da Bela Vista', local:'Sintra', estado:'Concluída', inicio:'2024-06-03', orc:27400, extraVal:0, adjudPct:0.20, custoBase:26900, progress:1, nAutos:3},
  {codigo:'2025-0003', titulo:'Pintura e isolamento de empena', cliente:'Condomínio Rua Maria Pia 210', local:'Lisboa', estado:'Concluída', inicio:'2025-02-17', orc:22300, extraVal:0, adjudPct:0.20, custoBase:15100, progress:1, nAutos:2},
];

// ---------- Mapa de trabalhos detalhado (obra 2025-0010) ----------
const ARTIGOS_2025_0010 = [
  {id:'1.1', desc:'Trabalhos preparatórios, montagem de estaleiro, proteção e sinalização', un:'vg', quant:1, vUnit:4249.90},
  {id:'2.1', desc:'Desmontagem e remoção da coluna de drenagem existente', un:'vg', quant:1, vUnit:1350.00},
  {id:'2.2', desc:'Fornecimento e assentamento de tubo PVC série U, DN50 — ramais sanitários', un:'ml', quant:24.5, vUnit:26.50},
  {id:'2.3', desc:'Fornecimento e assentamento de tubo PVC série U, DN75 — ramais banheira/bidé', un:'ml', quant:28.5, vUnit:31.50},
  {id:'2.4', desc:'Fornecimento e assentamento de tubo PVC série U, DN100 — coluna de queda', un:'ml', quant:42.0, vUnit:47.00},
  {id:'2.5', desc:'Caixa de visita DN315 com tampa articulada em PVC', un:'un', quant:4, vUnit:220.00},
  {id:'2.6', desc:'Tubo PVC série B, DN100 — ventilação primária', un:'ml', quant:18.0, vUnit:42.00},
  {id:'2.7', desc:'Ramal de ligação ao coletor predial existente', un:'un', quant:2, vUnit:680.00},
  {id:'2.8', desc:'Braçadeiras, apoios, abraçadeiras e fixações diversas', un:'vg', quant:1, vUnit:1250.00},
  {id:'3.1', desc:'Abertura e fecho de roços em alvenaria para passagem de tubagem', un:'m²', quant:85.0, vUnit:32.00},
  {id:'3.2', desc:'Argamassa de regularização e reposição de revestimento', un:'m²', quant:85.0, vUnit:24.50},
  {id:'3.3', desc:'Pintura das zonas intervencionadas (2 demãos)', un:'m²', quant:95.0, vUnit:14.80},
  {id:'4.1', desc:'Fornecimento e montagem de acessórios, curvas e derivações PVC', un:'vg', quant:1, vUnit:2800.00},
  {id:'4.2', desc:'Proteção acústica das tubagens com manta de lã de rocha', un:'ml', quant:35.0, vUnit:18.50},
  {id:'5.1', desc:'Ensaios de estanquidade e verificação de caudais', un:'vg', quant:1, vUnit:450.00},
  {id:'5.2', desc:'Limpeza geral e remoção de entulho a vazadouro autorizado', un:'vg', quant:1, vUnit:1800.00},
  {id:'6.1', desc:'Assistência técnica, coordenação e telas finais', un:'vg', quant:1, vUnit:1800.00},
  {id:'6.2', desc:'Levantamento, projeto de execução e plano de segurança', un:'vg', quant:1, vUnit:1767.10},
];
const EXTRA_2025_0010 = [
  {id:'E1', desc:'Substituição de troço de coletor enterrado degradado (imprevisto)', un:'ml', quant:6, vUnit:80.00},
  {id:'E2', desc:'Selagem e impermeabilização de passagens hidráulicas', un:'un', quant:4, vUnit:40.00},
];
const AUTOS_2025_0010 = [
  {n:1, data:'2025-07-28', exec:{'1.1':1,'2.1':1,'2.2':24.5,'2.3':28.5,'2.8':1}, execExtra:{}},
  {n:2, data:'2025-08-27', exec:{'2.4':42,'2.5':4,'2.6':18,'2.7':2,'4.1':1}, execExtra:{'E1':6}},
  {n:3, data:'2025-09-28', exec:{'3.1':85,'3.2':85,'4.2':35}, execExtra:{'E2':4}},
];

// ---------- Helpers de geração (obras sem mapa manual) ----------
function round2(x){return Math.round(x*100)/100;}
function addMonths(iso,n){const d=new Date((iso||'2025-01-01')+'T00:00:00');d.setMonth(d.getMonth()+n);return d.toISOString().slice(0,10);}

function genArtigos(orc){
  const tpl=[
    ['1.1','Trabalhos preparatórios, estaleiro e proteções','vg',0.08,null],
    ['2.1','Demolições, remoções e movimentação de terras','vg',0.12,null],
    ['2.2','Alvenarias, panos de parede e elementos de betão','m²',0.16,46],
    ['3.1','Rede de abastecimento de águas e drenagem','vg',0.14,null],
    ['3.2','Instalação elétrica, ITED e quadros','vg',0.10,null],
    ['4.1','Revestimentos cerâmicos, cantarias e pavimentos','m²',0.18,38],
    ['5.1','Pinturas, barramentos e isolamentos','m²',0.12,16],
    ['6.1','Ensaios, limpeza final e assistência técnica','vg',0.10,null],
  ];
  const items=[];let acc=0;
  tpl.forEach((t,i)=>{
    const last=i===tpl.length-1;
    let total=last?round2(orc-acc):round2(orc*t[3]);
    let quant,vUnit;
    if(t[4]&&!last){vUnit=t[4];quant=Math.round(total/t[4]*10)/10;total=round2(quant*vUnit);}
    else{quant=1;vUnit=round2(total);}
    acc=round2(acc+total);
    items.push({id:t[0],desc:t[1],un:t[2],quant,vUnit});
  });
  return items;
}
function genExtra(val){
  if(!val||val<=0)return [];
  return [
    {id:'E1',desc:'Trabalhos a mais — alterações solicitadas pelo cliente',un:'vg',quant:1,vUnit:round2(val*0.6)},
    {id:'E2',desc:'Trabalhos a mais — imprevistos detetados em obra',un:'vg',quant:1,vUnit:round2(val*0.4)},
  ];
}
function genAutos(meta,artigos,extra){
  const n=meta.nAutos||0;if(n===0)return [];
  const prog=meta.progress!=null?meta.progress:1;
  const autos=[];
  for(let i=0;i<n;i++){
    const exec={},execExtra={};
    artigos.forEach(a=>{exec[a.id]=round2(a.quant*prog/n);});
    extra.forEach(e=>{execExtra[e.id]=round2(e.quant*prog/n);});
    autos.push({n:i+1,data:addMonths(meta.inicio,i+1),exec,execExtra});
  }
  return autos;
}

// ---------- Construção das obras ----------
function buildObra(meta){
  const artigos=meta.detailed?ARTIGOS_2025_0010:genArtigos(meta.orc);
  const extra=meta.detailed?EXTRA_2025_0010:genExtra(meta.extraVal);
  const seedAutos=meta.detailed?AUTOS_2025_0010:genAutos(meta,artigos,extra);
  return Object.assign({},meta,{artigos,extra,seedAutos});
}
const OBRAS = META.map(buildObra);

// ---------- localStorage ----------
const LS_CUSTOS='obras_custos_v2', LS_AUTOS='obras_autos_v2', LS_OVERRIDE='obras_custo_ovr_v2';
function lsGet(k){try{const r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function userAutos(codigo){const all=lsGet(LS_AUTOS)||{};return all[codigo]||[];}
function userCustos(codigo){const all=lsGet(LS_CUSTOS)||{};return all[codigo]||[];}
function custoOverride(codigo){const all=lsGet(LS_OVERRIDE)||{};const v=all[codigo];return v;}
function saveUserAutos(codigo,arr){const all=lsGet(LS_AUTOS)||{};all[codigo]=arr;lsSet(LS_AUTOS,all);}
function saveUserCustos(codigo,arr){const all=lsGet(LS_CUSTOS)||{};all[codigo]=arr;lsSet(LS_CUSTOS,all);}
function saveCustoOverride(codigo,v){const all=lsGet(LS_OVERRIDE)||{};all[codigo]=v;lsSet(LS_OVERRIDE,all);}

// ---------- Cálculos ----------
function allAutos(obra){return [...obra.seedAutos, ...userAutos(obra.codigo)].map((a,i)=>Object.assign({},a,{n:i+1,label:a.label||('Auto '+(i+1))}));}
function custoDe(obra){
  const ents=userCustos(obra.codigo);
  if(ents.length)return ents.reduce((s,e)=>s+e.valor,0);
  const ovr=custoOverride(obra.codigo);
  return(ovr==null||isNaN(ovr))?obra.custoBase:ovr;
}
function valorObra(obra){
  const orcT=obra.artigos.reduce((s,a)=>s+a.quant*a.vUnit,0);
  const extraT=obra.extra.reduce((s,e)=>s+e.quant*e.vUnit,0);
  return {orcT:round2(orcT),extraT:round2(extraT),total:round2(orcT+extraT)};
}
function autoValores(obra,auto){
  const orcamento=obra.artigos.reduce((s,a)=>s+((auto.exec&&auto.exec[a.id])||0)*a.vUnit,0);
  const trabMais=obra.extra.reduce((s,e)=>s+((auto.execExtra&&auto.execExtra[e.id])||0)*e.vUnit,0);
  const deducao=-orcamento*(obra.adjudPct||0);
  const aFacturar=orcamento+deducao;
  const total=aFacturar+trabMais;
  return {orcamento:round2(orcamento),deducao:round2(deducao),aFacturar:round2(aFacturar),trabMais:round2(trabMais),total:round2(total)};
}
function calcObra(obra){
  const v=valorObra(obra);
  const custo=round2(custoDe(obra));
  const lucro=round2(v.total-custo);
  const margem=v.total?lucro/v.total:0;
  const autos=allAutos(obra);
  let faturado=0;
  autos.forEach(a=>{const av=autoValores(obra,a);faturado+=av.orcamento+av.trabMais;});
  faturado=round2(faturado);
  const saldo=round2(v.total-faturado);
  const pctFat=v.total?Math.max(0,Math.min(1,faturado/v.total)):0;
  return {valorObra:v.total,orcT:v.orcT,extraT:v.extraT,custo,lucro,margem,faturado,saldo,pctFat,nAutos:autos.length};
}
function autoResumo(obra){
  const autos=allAutos(obra);
  const mk=(arr,execKey)=>arr.map(it=>{
    const vTotal=round2(it.quant*it.vUnit);
    let fatQtd=0;
    const perAuto=autos.map(au=>{const m=au[execKey]||{};const q=m[it.id]||0;fatQtd+=q;return {qtd:q,total:round2(q*it.vUnit)};});
    fatQtd=round2(fatQtd);
    const fatValor=round2(fatQtd*it.vUnit);
    const saldoQtd=round2(it.quant-fatQtd);
    return Object.assign({},it,{vTotal,fatQtd,fatValor,saldoQtd,saldoValor:round2(saldoQtd*it.vUnit),perAuto});
  });
  const artigosRows=mk(obra.artigos,'exec');
  const extraRows=mk(obra.extra,'execExtra');
  const autoSummary=autos.map(au=>Object.assign({},autoValores(obra,au),{n:au.n,data:au.data,label:au.label}));
  const v=valorObra(obra);
  const fatTotal=round2(artigosRows.reduce((s,r)=>s+r.fatValor,0));
  const extraFat=round2(extraRows.reduce((s,r)=>s+r.fatValor,0));
  return {autos,artigosRows,extraRows,autoSummary,orcTotal:v.orcT,fatTotal,saldoOrc:round2(v.orcT-fatTotal),extraTotal:v.extraT,extraFat,saldoTBM:round2(v.extraT-extraFat)};
}

// ---------- Formatadores ----------
const _EUR=new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2});
const _EUR0=new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR',maximumFractionDigits:0});
const _PCT1=new Intl.NumberFormat('pt-PT',{style:'percent',minimumFractionDigits:1,maximumFractionDigits:1});
const _NUM=new Intl.NumberFormat('pt-PT',{minimumFractionDigits:2,maximumFractionDigits:2});
const _NUM3=new Intl.NumberFormat('pt-PT',{minimumFractionDigits:3,maximumFractionDigits:3});
function EUR(x){return _EUR.format(x||0);}
function EUR0(x){return _EUR0.format(x||0);}
function PCT1(x){return _PCT1.format(x||0);}
function NUM(x){return _NUM.format(x||0);}
function NUM3(x){return _NUM3.format(x||0);}
function QT(x){return (x===0||x==null)?'':Number(x).toLocaleString('pt-PT',{maximumFractionDigits:3});}
function fmtDate(iso){if(!iso)return '—';const p=iso.split('-');return p[2]+'/'+p[1]+'/'+p[0];}
function fmtDateShort(iso){if(!iso)return '—';const p=iso.split('-');const mn=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];return p[2]+'/'+mn[+p[1]-1]+'/'+p[0].slice(2);}

// ---------- Cores ----------
function estadoCor(e){if(e==='Concluída')return '#12895e';if(e==='Em execução')return '#2f6fed';if(e==='Adjudicada')return '#c77d1a';return '#8a94a6';}
function estadoTint(e){if(e==='Concluída')return '#e4f3ec';if(e==='Em execução')return '#eaf0fe';if(e==='Adjudicada')return '#f7eddb';return '#eef1f5';}
function margemCor(m){if(m>=0.18)return '#12895e';if(m>=0.08)return '#c77d1a';return '#cf4b3a';}
const CATS=['Materiais','Mão de obra','Subempreitadas','Equipamentos','Outros'];
function catCor(c){const m={'Materiais':'#2f6fed','Mão de obra':'#12895e','Subempreitadas':'#c77d1a','Equipamentos':'#7c4fcf','Outros':'#56627a'};return m[c]||'#56627a';}
function catTint(c){const m={'Materiais':'#eaf0fe','Mão de obra':'#e4f3ec','Subempreitadas':'#fef3e2','Equipamentos':'#f0edf8','Outros':'#eef1f5'};return m[c]||'#eef1f5';}

export {
  OBRAS, allAutos, calcObra, autoResumo, valorObra, autoValores, custoDe,
  userAutos, userCustos, custoOverride, saveUserAutos, saveUserCustos, saveCustoOverride,
  LS_CUSTOS, LS_AUTOS, LS_OVERRIDE,
  EUR, EUR0, PCT1, NUM, NUM3, QT, fmtDate, fmtDateShort,
  estadoCor, estadoTint, margemCor, CATS, catCor, catTint,
};
export function getObra(codigo){return OBRAS.find(o=>o.codigo===codigo)||OBRAS[0];}
export function orcItems(codigo){const o=getObra(codigo);return o.artigos;}
