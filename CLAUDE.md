# CLAUDE.md — Regras de manutenção (Gestão de Obras)

Instruções persistentes para qualquer alteração neste projeto. Lê sempre
**`ARQUITETURA.md`** primeiro: ele diz onde está cada coisa.

## Princípio central
O projeto está separado por camadas de propósito. **Nunca reestruturar tudo
para uma mudança pontual.** Identifica a camada certa e edita só esse ficheiro.

1. Abre `ARQUITETURA.md` → tabela "Onde mexo se eu quiser…".
2. Edita apenas o ficheiro indicado (de preferência com edição cirúrgica).
3. Confirma que a consola fica limpa.

## Regra de ouro
- **"O que se vê"** (layout, espaçamento, texto fixo, ordem) → ficheiro `.dc.html`.
- **"Como se calcula / de onde vem o dado"** → ficheiro em `src/`.
- Um template **nunca** calcula nem escolhe cores: recebe tudo pronto no `vm`.

## Camadas e suas fronteiras
- `src/data/` — só dados e geração determinística. Sem UI, sem localStorage.
- `src/core/` — funções puras (format, theme, calc, storage). Sem UI.
- `src/viewmodels/` — montam o objeto `vm` para um ecrã. Usam core+data. Sem UI.
- `*.dc.html` (filhos) — só leem `vm`. Sem lógica, sem cálculos.
- `Gestão de Obras.dc.html` (shell) — estado, navegação, ações, gravação.
  Delega cálculo/desenho. Não duplicar lógica que já existe em `src/`.

## Sentido das dependências (não criar ciclos)
`data → core → viewmodels → views`. O shell importa só o barril `src/index.js`.
Se acrescentares um módulo, reexporta-o em `src/index.js`.

## Receitas

### Editar dados de uma obra
`src/data/obras.seed.js` → array `OBRAS_RAW`. Só isto. Tudo recalcula sozinho.

### Mudar uma regra de cálculo (ex.: margem)
`src/core/calc.js`. Não tocar nos templates.

### Mudar uma cor semântica
`src/core/theme.js`. Não escrever hex soltos nos templates novos — usar estas funções via `vm`.

### Adicionar um separador novo no detalhe da obra
1. `src/viewmodels/detalhe.vm.js`: acrescenta a entrada em `tabs` e os dados do separador a `sel`.
2. `ObraDetalhe.dc.html`: adiciona o bloco `<sc-if value="{{ vm.tabXxx }}">` com o markup.
3. (Se precisar de cálculo) cria a função em `src/core/calc.js`.

### Adicionar um ecrã novo
1. Cria `NovoEcra.dc.html` (DC filho, **na raiz**, só lê `vm`).
2. Cria `src/viewmodels/novo.vm.js` e reexporta `buildNovo` em `src/index.js`.
3. No shell: estado `view`, monta `<dc-import name="NovoEcra" vm="{{ novoVM }}">`
   dentro de um `<sc-if>`, e chama `buildNovo` no `renderVals()`.

## Restrições do framework (não esquecer)
- DCs filhos **têm de estar na raiz** (irmãos do shell) — `<dc-import>` só vê irmãos.
- Estilos **inline** apenas; nada de classes CSS nem folhas de estilo.
- Nada de expressões nos `{{ }}` do template (só caminhos com ponto). Calcular no `vm`.
- `support.js` é runtime — **nunca editar**.
- localStorage: só mexer nas chaves `obras_*` que a app define; nunca apagar outras.

## Estilo de código
- Português nos nomes de domínio, comentários e textos de UI.
- Funções puras e pequenas; um propósito por ficheiro.
- Preferir editar (str_replace) a reescrever ficheiros inteiros.
