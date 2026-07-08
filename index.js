// ============================================================
// core/xlsx.js — leitor mínimo de .xlsx (camada NÚCLEO)
// Lê a 1.ª folha de um ficheiro Excel SEM bibliotecas externas:
// descomprime o ZIP com DecompressionStream e faz parse do XML.
// Suporta strings inline e sharedStrings. Funções puras, sem UI.
// ============================================================

async function inflateRaw(bytes){
  const ds = new DecompressionStream('deflate-raw');
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// Extrai uma entrada do ZIP pelo nome (ou null se não existir).
async function lerEntrada(buf, dv, nome){
  const u16 = o => dv.getUint16(o, true), u32 = o => dv.getUint32(o, true);
  let eocd = -1;
  for(let i = buf.length - 22; i >= 0; i--){ if(u32(i) === 0x06054b50){ eocd = i; break; } }
  if(eocd < 0) throw new Error('ZIP inválido');
  const cdOff = u32(eocd + 16), cdCount = u16(eocd + 10);
  let p = cdOff;
  for(let i = 0; i < cdCount; i++){
    const method = u16(p + 10), compSize = u32(p + 20);
    const nameLen = u16(p + 28), extraLen = u16(p + 30), commentLen = u16(p + 32), lho = u32(p + 42);
    const name = new TextDecoder().decode(buf.slice(p + 46, p + 46 + nameLen));
    if(name === nome){
      const lNameLen = u16(lho + 26), lExtraLen = u16(lho + 28);
      const start = lho + 30 + lNameLen + lExtraLen;
      const data = buf.slice(start, start + compSize);
      return method === 0 ? data : await inflateRaw(data);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

// Remove o ruído de vírgula flutuante que o Excel grava nos números
// (ex.: "1.1000000000000001" → "1.1", "4249.8999999999996" → "4249.9").
// Só toca em decimais; inteiros e texto passam intactos. Sem este passo,
// códigos de artigo (CAP) como 1.1 chegam com 18 dígitos e são rejeitados.
function limparNumero(s){
  if(!/^-?\d*\.\d+$/.test(s)) return s;
  const n = parseFloat(s);
  if(!isFinite(n)) return s;
  return String(parseFloat(n.toPrecision(12)));
}

function desescapar(s){
  return s == null ? '' : s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
}

// Lê a 1.ª folha → { linhas:[{ n, cells:{LETRA:texto} }] }
export async function parseXlsx(arrayBuffer){
  const buf = new Uint8Array(arrayBuffer);
  const dv = new DataView(buf.buffer);

  // sharedStrings (opcional)
  let shared = [];
  const ssBytes = await lerEntrada(buf, dv, 'xl/sharedStrings.xml');
  if(ssBytes){
    const ss = new TextDecoder().decode(ssBytes);
    shared = [...ss.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m =>
      desescapar((m[1].match(/<t[^>]*>([\s\S]*?)<\/t>/g) || []).map(t => t.replace(/<[^>]+>/g, '')).join('')));
  }

  const sheetBytes = await lerEntrada(buf, dv, 'xl/worksheets/sheet1.xml');
  if(!sheetBytes) throw new Error('folha não encontrada');
  const xml = new TextDecoder().decode(sheetBytes);

  const linhas = [];
  for(const r of xml.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)){
    const cells = {};
    for(const c of r[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)){
      const attrs = c[1], inner = c[2] || '';
      const rm = attrs.match(/r="([A-Z]+)\d+"/); if(!rm) continue;
      const col = rm[1];
      const tm = attrs.match(/t="([^"]+)"/); const t = tm ? tm[1] : '';
      const isStr = inner.match(/<t[^>]*>([\s\S]*?)<\/t>/);
      const v = inner.match(/<v>([\s\S]*?)<\/v>/);
      let val = '';
      if(t === 'inlineStr')      val = desescapar(isStr ? isStr[1] : '');
      else if(t === 's')         val = shared[+(v ? v[1] : -1)] || '';
      else if(t === 'str')       val = desescapar(v ? v[1] : '');
      else                       val = limparNumero(v ? v[1] : '');
      cells[col] = val;
    }
    linhas.push({ n: +r[1], cells });
  }
  return { linhas };
}

// ---- Resumo de uma folha para lançar como custo ----
function num(s){
  let v = String(s).replace(/[^\d.,-]/g, '');
  // remove separador de milhares (ponto seguido de 3 dígitos) e troca vírgula decimal
  v = v.replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}
function isoDe(br){
  const m = String(br).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : '';
}

// Interpreta a folha (parseXlsx) e devolve um resumo pronto a lançar:
//   { nLinhas, total, colaboradores[], dataInicio, dataFim, categoria, titulo }
export function resumoCusto(parsed){
  const linhas = parsed.linhas;

  // 1. linha de cabeçalho = a 1.ª que menciona "valor", "colaborador" ou "descri"
  let hdr = null;
  for(const l of linhas){
    const vals = Object.values(l.cells).map(v => v.toLowerCase());
    if(vals.some(v => v.includes('valor') || v.includes('colaborador') || v.includes('descri') || v.includes('tarefa'))){ hdr = l; break; }
  }
  const headers = hdr ? hdr.cells : {};
  const acharCol = (...termos) => {
    for(const t of termos){
      for(const [letra, txt] of Object.entries(headers)){ if(txt.toLowerCase().includes(t)) return letra; }
    }
    return null;
  };
  const colValor = acharCol('valor realizado', 'valor realiz', 'valor previsto', 'valor', 'custo', 'total', 'preço');
  const colNome  = acharCol('colaborador', 'descri', 'tarefa', 'artigo', 'designação', 'nome');
  const colData  = acharCol('data final', 'data fim', 'data de início', 'data inicio', 'data');
  const maoObra  = !!acharCol('colaborador', 'horas');

  // título da folha (1.ª célula de texto antes do cabeçalho)
  let titulo = '';
  for(const l of linhas){ if(hdr && l.n >= hdr.n) break; const t = Object.values(l.cells).find(v => v && isNaN(+v)); if(t){ titulo = t; break; } }

  const dados = linhas
    .filter(l => hdr ? l.n > hdr.n : true)
    .filter(l => colValor ? num(l.cells[colValor]) > 0 : Object.keys(l.cells).length > 0);

  let total = 0; const nomes = new Set(); const datas = [];
  dados.forEach(l => {
    if(colValor) total += num(l.cells[colValor]);
    if(colNome && l.cells[colNome]) nomes.add(l.cells[colNome]);
    if(colData && l.cells[colData]){ const iso = isoDe(l.cells[colData]); if(iso) datas.push(iso); }
  });
  datas.sort();

  return {
    titulo,
    nLinhas: dados.length,
    total: Math.round(total * 100) / 100,
    colaboradores: [...nomes],
    dataInicio: datas[0] || '',
    dataFim: datas[datas.length - 1] || '',
    categoria: maoObra ? 'Mão de obra' : 'Materiais',
  };
}

// ---- Ficheiro .xlsx → linhas do mapa de trabalhos ----
// Reconstrói cada linha da folha como TSV (células ordenadas por coluna A,B,C…)
// e reutiliza a heurística de parseColadosOrc. Ignora linhas vazias.
export function parseXlsxOrc(parsed){
  const linhas = (parsed && parsed.linhas) || [];
  const ordenarCols = a => a.length * 100 + a.charCodeAt(a.length - 1); // A<B<…<Z<AA
  const tsv = linhas.map(l => {
    const letras = Object.keys(l.cells).sort((a, b) => ordenarCols(a) - ordenarCols(b));
    return letras.map(L => l.cells[L]).join('\t');
  }).join('\n');
  return parseColadosOrc(tsv);
}

// Prefixo do "Cód. Artigo" (ex.: SUB-16, MAT-362, ADM-7) -> família de custo.
// É a forma mais fiável de separar um ficheiro que mistura várias famílias na
// mesma folha. Mapeia para as 5 categorias-cor conhecidas; prefixos fora da
// tabela mantêm-se como família própria (com cor neutra).
const FAMILIA_POR_PREFIXO = {
  MAT:'Materiais', MATERIAL:'Materiais', MT:'Materiais', ART:'Materiais',
  SUB:'Subempreitadas', SUBEMP:'Subempreitadas', SE:'Subempreitadas',
  MO:'Mão de obra', MDO:'Mão de obra', MOB:'Mão de obra', RH:'Mão de obra', RRHH:'Mão de obra',
  EQ:'Equipamentos', EQP:'Equipamentos', EQU:'Equipamentos', EQUIP:'Equipamentos', ALU:'Equipamentos',
  ADM:'Outros', ADMIN:'Outros', OUT:'Outros', DIV:'Outros', TRA:'Outros', TRANS:'Outros',
};
// Devolve { familia, categoria } a partir de um Cód. Artigo, ou null se vazio.
// familia  = rótulo mostrado no filtro (categoria conhecida ou o próprio prefixo)
// categoria = uma das 5 CATS, usada só para cor/tint.
export function familiaDeCodigo(cod){
  const s = String(cod || '').trim();
  if(!s) return null;
  const pref = (s.match(/^[A-Za-zÀ-ÿ]+/) || [''])[0].toUpperCase();
  if(!pref) return null;
  const cat = FAMILIA_POR_PREFIXO[pref];
  return cat ? { familia:cat, categoria:cat } : { familia:pref, categoria:'Outros' };
}

// ---- Ficheiro .xlsx (materiais / equipamentos / recursos humanos) → lançamentos de custo ----
// Deteta o TIPO de mapa pela linha de cabeçalho e devolve uma lista de
// lançamentos { data(iso), categoria, familia, codigo, descricao, fornecedor, valor }
// — um por linha válida (valor ≠ 0). Mapeia as colunas por nome, por isso aceita
// as três folhas exportadas do OG-Projetos sem configuração. Quando existe a
// coluna "Cód. Artigo", a FAMÍLIA vem do prefixo do código (linha a linha), o
// que separa corretamente um ficheiro que mistura famílias na mesma folha.
export function parseXlsxCustos(parsed){
  const linhas = (parsed && parsed.linhas) || [];

  // 1. cabeçalho = 1.ª linha que menciona valor / colaborador / equipamento / artigo / descri
  let hdr = null;
  for(const l of linhas){
    const vals = Object.values(l.cells).map(v => String(v).toLowerCase());
    if(vals.some(v => /valor|colaborador|equipamento|artigo|descri|tarefa/.test(v))){ hdr = l; break; }
  }
  if(!hdr) return [];
  const headers = hdr.cells;
  const has = (re) => Object.values(headers).some(t => re.test(String(t).toLowerCase()));
  // Procura a 1.ª coluna cujo cabeçalho casa uma das preferências (inc), por ordem.
  const achar = (...prefs) => {
    for(const p of prefs){
      for(const [L, t] of Object.entries(headers)){
        const txt = String(t).toLowerCase();
        if(p.inc.test(txt) && !(p.exc && p.exc.test(txt))) return L;
      }
    }
    return null;
  };

  // 2. categoria de custo POR DEFEITO (fallback quando não há Cód. Artigo)
  let categoriaFolha = 'Outros';
  if(has(/colaborador/))        categoriaFolha = 'Mão de obra';
  else if(has(/equipamento/))   categoriaFolha = 'Equipamentos';
  else if(has(/artigo|material|pre.o uni|qtd/)) categoriaFolha = 'Materiais';

  // 3. colunas (valor preferencialmente "realizado"/"sem IVA")
  const colValor = achar({inc:/valor realiz/}, {inc:/total s\/?\s*iva/}, {inc:/valor previsto/}, {inc:/^valor$/}, {inc:/total/, exc:/c\/\s*iva|com iva/}, {inc:/custo/}, {inc:/pre.o/});
  const colData  = achar({inc:/data final/}, {inc:/data fim/}, {inc:/data de in.cio/}, {inc:/data in.cio/}, {inc:/^data$/}, {inc:/data/});
  const colDesc  = achar({inc:/^artigo$/}, {inc:/artigo/, exc:/c.d/}, {inc:/colaborador/}, {inc:/equipamento/}, {inc:/descri/}, {inc:/designa/}, {inc:/tarefa/});
  const colForn  = achar({inc:/entidade/}, {inc:/fornecedor/}, {inc:/subempreit/});
  const colCod   = achar({inc:/c.d.*artigo/}, {inc:/c.digo.*artigo/}, {inc:/^c.d/});
  if(colValor == null) return [];

  const out = [];
  for(const l of linhas){
    if(l.n <= hdr.n) continue;
    const valor = num(l.cells[colValor]);
    if(!(Math.abs(valor) > 0.0001)) continue;
    const data = colData ? isoDe(l.cells[colData]) : '';
    const descricao = (colDesc ? String(l.cells[colDesc] || '') : '').trim() || 'Custo importado';
    const fornecedor = colForn ? String(l.cells[colForn] || '').trim() : '';
    const codigo = colCod ? String(l.cells[colCod] || '').trim() : '';
    const fam = familiaDeCodigo(codigo);
    const categoria = fam ? fam.categoria : categoriaFolha;
    const familia = fam ? fam.familia : categoriaFolha;
    out.push({ data, categoria, familia, codigo, descricao, fornecedor, valor: Math.round(valor * 100) / 100 });
  }
  return out;
}

// ---- Colar do Excel: converte texto (TSV) em linhas do mapa de trabalhos ----
// Aceita células separadas por tab (cópia do Excel) ou por ';' / 2+ espaços.
// Interpreta cada linha por heurística: código curto = Item, texto longo =
// Descrição, unidade conhecida = Un., e os 2 últimos números = Qt. e V. unit.
export function parseColadosOrc(texto){
  const linhas = String(texto || '').replace(/\r/g, '').split('\n');
  const itens = [];
  const codeRe = /^[A-Za-z]?\d+([.\-][\dA-Za-z]+)*$|^[A-Z]{1,4}$/;
  const uniRe  = /^(vg|un|und|ud|m|m2|m²|m3|m³|ml|km|kg|h|hr|hora|pç|pc|cj|gl|t|l|dia|mês|mes|fg)$/i;

  for(const raw of linhas){
    const linha = raw.trim();
    if(!linha) continue;
    let cells = (raw.includes('\t') ? raw.split('\t') : raw.split(/;| {2,}/)).map(c => c.trim());
    cells = cells.filter((c, i) => c !== '' || i < cells.length); // mantém posições

    const nums = cells.map((c, i) => ({ i, v: num(c) })).filter(x => Number.isFinite(x.v) && /\d/.test(cells[x.i]));
    if(nums.length === 0) continue; // cabeçalho ou linha sem valores → ignora

    let vunit = 0, qt = 1, qtI = -1, vunitI = -1;
    vunit = nums[nums.length - 1].v; vunitI = nums[nums.length - 1].i;
    if(nums.length >= 2){ qt = nums[nums.length - 2].v; qtI = nums[nums.length - 2].i; }

    const txt = cells.map((c, i) => ({ i, c })).filter(x => x.c && x.i !== qtI && x.i !== vunitI);
    let id = '', uni = '';
    for(const t of txt){ if(!id && t.c.length <= 8 && codeRe.test(t.c)){ id = t.c; break; } }
    for(const t of txt){ if(t.c === id) continue; if(!uni && uniRe.test(t.c)){ uni = t.c; break; } }
    const rem = txt.filter(t => t.c !== id && t.c !== uni).sort((a, b) => b.c.length - a.c.length);
    let desc = rem.length ? rem[0].c : '';
    if(!desc && id){ desc = id; id = ''; }
    if(!desc && vunit === 0) continue;

    itens.push({ id, desc, uni: uni || 'vg', qt: Number.isFinite(qt) ? qt : 1, vunit: Number.isFinite(vunit) ? vunit : 0 });
  }
  return itens;
}
