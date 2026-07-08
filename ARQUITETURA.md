# 🗺️ ARQUITETURA — Gestão de Obras

> Mapa único do projeto. **Antes de qualquer alteração, lê este ficheiro,
> encontra a camada certa e mexe SÓ no ficheiro indicado.** Não é preciso
> reestruturar nada para fazer uma mudança pontual.

A aplicação é uma SPA de controlo financeiro de obras, feita como
**Design Component (DC)**. Está organizada em camadas, ao estilo de uma app
profissional: **dados → núcleo → view-models → vista (UI)**, com um **shell**
fino a orquestrar tudo.

---

## 🌳 Árvore de ficheiros

```
Gestão de Obras.dc.html      ← SHELL · estado + routing + ações. NÃO desenha ecrãs.
│
├── views (DCs filhos · só UI, sem lógica) ───────────────────────────────
│   Login.dc.html            ← ecrã de login (contas + níveis de acesso)
│   Sidebar.dc.html          ← navegação lateral (obras + utilizador + sair)
│   Faturacao.dc.html        ← separador "Faturação" (só admin): autos a faturar
│   Carteira.dc.html         ← ecrã "Carteira": KPIs, faturação, gráfico, tabela
│   ObraDetalhe.dc.html       ← ecrã "Obra": KPIs + 4 separadores
│   ModalAuto.dc.html         ← drawer "Novo auto de medição"
│   ModalCusto.dc.html        ← diálogo "Adicionar custo"
│   ModalObra.dc.html         ← diálogo "Nova obra" (+ escolha de acessos)
│   ModalCodigo.dc.html       ← diálogo "Código da fatura" (proforma/fatura)
│   Aprovacao.dc.html         ← separador "Aprovação" (só admin)
│
└── src/ (JavaScript puro · sem UI) ───────────────────────────────────────
    index.js                 ← BARRIL: a única coisa que o shell importa
    │
    ├── data/
    │   obras.seed.js        ← DADOS: as 8 obras + mapas de orçamento
    │
    ├── core/
    │   format.js            ← formatação € / % / datas (pt-PT)
    │   theme.js             ← cores e tokens (estado, categoria, margem, acento)
    │   calc.js              ← cálculos: custo, lucro, margem, faturação, saldo
    │   storage.js           ← localStorage (carregar/gravar dados de obra)
    │   auth.js              ← contas, papéis (admin/utilizador) e sessão
    │
    └── viewmodels/
        login.vm.js          ← prepara as props do ecrã de login
        sidebar.vm.js        ← prepara as props da Sidebar
        faturacao.vm.js      ← junta todos os autos + estado de faturação
        carteira.vm.js       ← prepara as props da Carteira
        detalhe.vm.js        ← prepara as props do ObraDetalhe
        modais.vm.js         ← prepara as props dos dois modais

support.js                   ← runtime do framework (NÃO editar)
ARQUITETURA.md / CLAUDE.md   ← este mapa + regras de manutenção
_legado/                     ← versões antigas arquivadas (referência)
```

---

## 🧭 Fluxo de dados (uma direção)

```
src/data ──▶ src/core ──▶ src/viewmodels ──▶ views (UI)
                  ▲                              │
                  └──────── eventos (on) ────────┘  (cliques sobem ao SHELL)
```

1. **SHELL** guarda o estado (obra selecionada, separador, filtros, modais…).
2. No `renderVals()`, o shell chama os **view-models** passando
   `(obras, estado, opts, on)`.
3. Cada **view-model** usa **core** (cálculos, cores, formatação) sobre os
   **dados** e devolve um objeto pronto (`vm`).
4. O shell passa esse `vm` ao **DC filho** correspondente (`<dc-import>`).
5. Os DCs filhos **só leem `vm`** — nenhum cálculo dentro do template.
6. Os cliques chamam handlers de `on` → o shell faz `setState` → repete o ciclo.

---

## 🔎 "Onde mexo se eu quiser…" (tabela de decisão)

| Quero alterar…                                   | Ficheiro a abrir |
|--------------------------------------------------|------------------|
| Texto/valores/clientes/estados das obras         | `src/data/obras.seed.js` |
| Linhas do orçamento (modal de auto)              | `src/data/obras.seed.js` (`ORC_2025_0010` / `genOrcItems`) |
| Como se calcula custo/lucro/margem/faturado      | `src/core/calc.js` |
| Formato de € , % ou datas                        | `src/core/format.js` |
| Cores de estado, categoria, margem, ou acento    | `src/core/theme.js` |
| Chaves/forma de gravação no navegador            | `src/core/storage.js` |
| Contas, palavras-passe ou papéis (admin/gestor/utilizador) | `src/core/auth.js` |
| Que ações cada papel pode fazer                  | `src/core/auth.js` (`podeEditar`/`podeApagarObra`/`podeApagarAuto`/`podeFaturar`/`podeAprovar`/`veTudo`/`podeVerObra`) |
| Fluxo de aprovação (enviar → aprovar/reprovar)   | shell (`enviarAprovacao`/`aprovarAuto`/`reprovarAuto`) + `calc.aprovDe/aprovInfo` + `Aprovacao.dc.html`/`aprovacao.vm.js` |
| Código de fatura pedido ao faturar               | shell (`pedirCodigo`/`codConfirm`/`marcarFat`) + `ModalCodigo.dc.html` + `modais.vm.js` (`buildCodigoModal`) |
| Quem vê cada obra (acessos)                       | shell (`setObraAcesso`/`obraAcesso`, filtro em `_obras`) + `obras_acesso_v1`; UI no `ModalObra`/`ObraDetalhe` |
| Estado "faturado" de um auto / separador Faturação | `Faturacao.dc.html` + `faturacao.vm.js` + `calc.autosFaturaveis` |
| Trabalho não contabilizado (produção/lucro sem faturação) | shell (`tncAdd`/`tncDel`) + `calc.tncDe/tncTotalDe` + secção no CF de `ObraDetalhe.dc.html` (`detalhe.vm.js`); chave `obras_tnc_v1` |
| Auto de fecho (concluir obra + acerto de adjudicação)  | shell (`fecharObra`) + `calc.fechoDe` (naoExec/acertoAdjud em `calc()`) + separador Autos de `ObraDetalhe.dc.html`; chave `obras_fecho_v1` |
| Categorias de custo (famílias) / filtro automático por família | `theme.CATS` (lista) + `detalhe.vm.js` (`custoFamilias`, `custoFamilia` no state do shell). A família de um custo importado vem do prefixo do "Cód. Artigo" (`xlsx.familiaDeCodigo`, `FAMILIA_POR_PREFIXO`) |
| **Visual** da barra lateral                      | `Sidebar.dc.html` (+ `sidebar.vm.js` se for dado novo) |
| **Visual** do ecrã Carteira (KPIs/gráfico/tabela)| `Carteira.dc.html` (+ `carteira.vm.js`) |
| **Visual** do detalhe da obra / separadores      | `ObraDetalhe.dc.html` (+ `detalhe.vm.js`) |
| **Visual** dos modais                            | `ModalAuto.dc.html` / `ModalCusto.dc.html` (+ `modais.vm.js`) |
| Adicionar um separador / ecrã novo               | ver "Receitas" no `CLAUDE.md` |
| Estado global, navegação, gravação nas ações     | `Gestão de Obras.dc.html` (shell) |
| Tweaks (acento, densidade, realce de margem)     | `data-props` do shell |

> Regra de ouro: **"o que se vê"** → ficheiro `.dc.html`;
> **"como se calcula / de onde vem"** → ficheiro em `src/`.

---

## 🧩 Contratos entre camadas (o que cada `vm` entrega)

- **Sidebar** ← `sidebarVM`: `navObras[]`, `carteiraNavStyle`, `brandStyle`, `onGoCarteira`.
- **Carteira** ← `carteiraVM`: `kpis`, `chips[]`, `rows[]`, `cols[]`, `chart{rows[],maxFmt}`.
- **ObraDetalhe** ← `detalheVM`: `sel{…}`, `tabs[]`, `tabRent/tabCustos/tabCF/tabAutos`, `onBack`.
- **ModalAuto** ← `autoModal`: `items[]`, `date`, `totalFmt`, `onDate/onSave/onClose…`.
- **ModalCusto** ← `custoM`: `cats[]`, campos do formulário + `onSave/onClose…`.

Cada filho lê tudo de uma só prop `vm`. Estilos e handlers vêm já prontos
dentro do `vm` (o template nunca calcula nem decide cores).

---

## ⚙️ Notas técnicas

- **Autenticação:** sem sessão iniciada, o shell mostra só `Login.dc.html`.
  As contas e papéis vivem em `src/core/auth.js`. Ambos os papéis são
  editores (criam obras, editam o auto base, criam autos e custos): a única
  ação reservada a `admin` é **apagar uma obra** (`podeApagarObra`). A sessão
  persiste em `obras_sessao_v1`. O shell bloqueia as ações de escrita conforme
  `opts.podeEditar` / `opts.podeApagarObra` e as vms escondem os botões.

- O shell importa `src/index.js` **dinamicamente** em `componentDidMount`.
  Enquanto carrega, mostra "a carregar…" e só depois monta os filhos.
- Os DCs filhos **têm de ser irmãos** do shell (mesma pasta) — exigência do
  `<dc-import>`. Por isso ficam na raiz e não dentro de `views/`.
- A lógica em `src/` é **JavaScript puro com `import`/`export`** (módulos ES).
  Funções puras: recebem dados, devolvem dados. Sem tocar no DOM.
- Persistência (localStorage), coleções por código de obra:
  `obras_custo_v1` (custo manual), `obras_autos_v1` (autos do utilizador),
  `obras_custos_v1` (lançamentos de custo), `obras_autofat_v1` (faturação +
  código de fatura), `obras_aprov_v1` (aprovação de autos/adjudicação),
  `obras_acesso_v1` (que utilizadores veem cada obra).

- **Papéis:** `admin` (aprova/reprova, apaga, fatura, vê tudo), `gestor`
  (edita + fatura autos aprovados com código, vê tudo), `utilizador` (edita,
  cria obras — fica vinculado —, envia autos para aprovação; só vê as obras a
  que tem acesso). Fluxo do auto: rascunho → pendente → aprovado|reprovado;
  só APROVADO aparece na Faturação. Reprovado volta ao criador (reenvia).
