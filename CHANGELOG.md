# Changelog — OnBible PWA

Todas as mudanças notáveis deste projeto são documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [Unreleased]

### Adicionado

- **Livros PDF:** `Primeiros Socorros para um casamento ferido.pdf` incluído em `db/books/pdf/pdf_index.json` (ficheiro na pasta sem entrada no índice; distinto do slug `primeiros-socorros-para-um-casamento-ferido.pdf`). `Livro - O Desafio De Amar - Prova de Fogo.pdf` também indexado. Novas entradas: `CASAMENTO DIVÓRCIO E NOVO CASAMENTO - Kenneth E. Hagin.pdf`, `Casamento blindado.pdf`, `demonios-e-libertacao-no-ministerio-de-jesus-frank-hammond.pdf`, `O Poder Através da Oração.PDF`.

### Alterado

- **Projeção:** o item do menu lateral «Projeção» passa a abrir `/projector` numa **nova aba** (`target="_blank"`, `rel="noopener noreferrer"` em `Layout.jsx`). Teste em `tests/layoutProjectorLink.test.jsx`.

### Adicionado

- **Cantor Cristão — letras:** preenchimento de `letra` na maioria dos ficheiros `db/cantorcristao/*.json` via `scripts/import-cantor-letras-hymnary.py` (Hymnary.org CC1971 quando há «Representative Text» em português; Letras.com.br com slugs a partir do título do índice, do título da página do hino no Hymnary, da primeira linha do texto e do padrão `…-N-do-cc`). Texto do **Hino Nacional Brasileiro** (577) em `scripts/cantor-letras-extra.json` (conforme [Wikisource](https://pt.wikisource.org/wiki/Hino_Nacional_Brasileiro)). Teste de cobertura mínima: `tests/cantorcristaoLyrics.test.js` (até 85 hinos podem permanecer sem letra automática, quando as fontes públicas não a expõem).

- **Livros PDF:** sete novos PDFs em `db/books/pdf/` passaram a constar de `pdf_index.json` (lista na app e pacote offline). Teste de sincronização pasta ↔ índice em `tests/pdfIndexSync.test.js`.
- **Versões da Bíblia:** o seletor de tradução (Configurações, Projetor, Sermões, leitura) inclui as **19** entradas do catálogo `db/books/json/index.json` — árabe, chinês (CUV/NCV), alemão, grego, inglês (BBE/KJV), esperanto, espanhol, finlandês, francês, coreano, português (AA/ACF/NVI), romeno, russo e vietnamita — com URLs para `rodriguesfas/biblie` (`src/lib/bibleVersions.js`). Testes em `tests/bibleVersions.test.js`.

### Alterado

- **Configurações:** secção «Recursos offline» colocada no **final** da página (`SettingsPage.jsx`), depois de versão da Bíblia, backup, aparência e tipografia.

- **Dicionário — língua portuguesa:** deixou de usar API externa; passou a dados **locais** em `db/dicionario_pt/` (índice `lista_letras.json`, chunks por letra). Geração/amostra: `scripts/generate-dicionario-pt.mjs`. Na leitura, após o dicionário bíblico, consulta-se este léxico (`lookupBiblicalThenPortuguese` em `src/lib/dictionaryData.js`, `src/lib/portugueseDictionary.js`). **Configurações:** secção «Recursos offline» com botão para guardar o pacote do dicionário PT no cache do Service Worker (`src/lib/offlineResources.js`, `sw.js` continua com `onbible-cache-v4-spa`). Páginas `BookPage`, `DictionaryPage`, `AboutPage` e testes actualizados.

### Adicionado

- **Recursos offline (PWA):** manifesto de pacotes em `src/lib/offlineResources.js` (`OFFLINE_RESOURCE_PACKS`, `getPackAssetUrls`, `precachePack`, `precacheUrlList`, memoização e verificação por amostragem em listas grandes). Pacotes: dicionário PT, dicionário bíblico, traduções da Bíblia (URLs em `bibleVersions.js`), Strong's, Cantor Cristão, Harpa Cristã, concordância, livros PDF. UI em `SettingsPage.jsx` com uma linha por pacote; estilos `.offline-pack-*` em `src/index.css`. Testes em `tests/offlineResources.test.js`.

### Removido

- Stack **vanilla** não usada pela SPA React: páginas HTML na raiz (`book.html`, `markers.html`, `bible_play.html`, `settings.html`, `player.html`, `index-legacy.html`, `changelog.html` — o changelog em produção continua em `/changelog` via React), pastas `assets/js`, `assets/css`, `assets/libs`, `assets/fonts` e `vendor/` na raiz. Mantido `assets/images/` (favicon, logo, PWA). Teste de invariantes do repositório em `tests/repoLegacyRemoved.test.js`. `vite.config.js`: watch do dev server deixa de ignorar pastas já inexistentes.

### Adicionado

- **Git / Husky:** hook `pre-commit` (`.husky/pre-commit`) que bloqueia o commit quando há alterações em stage em `src/` ou `tests/` sem `CHANGELOG.md` também em stage; script `scripts/check-changelog-staged.mjs`, política em `scripts/changelog-policy.mjs`, testes em `tests/changelog-policy.test.js`; comando `npm run check:changelog`; variável `SKIP_CHANGELOG=1` para exceções pontuais (`package.json`, `package-lock.json`).
- Leitura bíblica (**React**): tooltip ao selecionar uma palavra no texto do versículo com definição do **Dicionário Bíblico** (entrada exata por termo normalizado), posicionamento acima/abaixo da seleção, exclusão de áreas fora de `.verse-item` (ex.: referências cruzadas), link para `/dictionary` (`src/pages/BookPage.jsx`, `src/index.css`, `src/lib/dictionaryData.js`).
- Testes unitários do cliente do dicionário: normalização, primeira palavra da seleção, busca por termo, carga de chunks com `fetch` mockado (`tests/dictionaryData.test.js`).

- Página **Cantor Cristão** (`/hymnal`): listagem de 581 hinos com busca por número ou título, visualização da letra com separação de estrofes/coro, controle de tamanho de fonte, navegação entre hinos (setas do teclado), e skeleton loaders (`src/pages/HymnalPage.jsx`). Consome dados de `/db/cantorcristao/`.
- Menu **Cantor Cristão** na sidebar, e atalho no **Acesso Rápido** do Dashboard
- Testes unitários para a lógica de carregamento e busca do Cantor Cristão (`tests/hymnalPage.test.js`)
- Página **Harpa Cristã** (`/harpa`): listagem dos louvores com busca por número ou título, leitura da letra em modal com estrofes/coro, ajuste de fonte e navegação entre louvores (`src/pages/HarpaPage.jsx`). Consome dados de `/db/harpacrista/`.
- Menu **Harpa Cristã** na sidebar, e atalho no **Acesso Rápido** do Dashboard
- Testes unitários base da Harpa Cristã (`tests/harpaPage.test.js`)
- Área **Livros PDF** (`/books`): listagem de livros com busca por título, abertura em leitor incorporado e ação para abrir em nova aba (`src/pages/PdfBooksPage.jsx`, `db/books/pdf/pdf_index.json`).
- Menu **Livros PDF** na sidebar, e atalho no **Acesso Rápido** do Dashboard
- Testes unitários para helpers da área de PDFs (`tests/pdfBooksPage.test.js`)
- Banner de instalação PWA: notificação no topo para quem usa o site no navegador (não instalado), com botão «Instalar» no Chrome/Edge e instruções para «Adicionar ao ecrã inicial» no iOS; adiável por 14 dias (`PwaInstallBanner.jsx`, `src/lib/pwaInstall.js`)
- Gerenciamento de Notas nos Versículos: novo modal de anotações acessível pelo menu de marcação (`book.html`, `js/book.js`)
- Indicador visual de Notas: ícone de nota (📝) exibido ao lado de versículos com anotações salvas
- Página "Meus Marcadores" (`markers.html`, `js/markers.js`): visualização consolidada de todos os versículos sublinhados e notas pessoais, organizados por livro
- Integração de Notas no Banco de Dados: métodos `getNote`, `setNote`, `deleteNote` e `getAllNotes` no `js/db.js` via Dexie.js
- Menu "Marcadores" adicionado à barra lateral e à navegação inferior em todas as páginas principais
- Sincronização / Exportação Segura: sistema de Backup e Restauração local via arquivo JSON em `settings.html` (`js/backup.js`)
- Modo Pregação/Púlpito: tela imersiva fullscreen com fundo preto, fonte grande e barra de navegação mínima (`book.html`)
- Seletor de tipografia com 4 estilos (Clássica, Moderna, Pregação, Manuscrita) persistido via `localStorage`
- Skeleton loader animado (shimmer) para o texto bíblico em `book.html`
- Bottom Navigation para mobile (≤768px) em todas as páginas principais, ocultando o drawer lateral
- Evento `pulpit-chapter-changed` para sincronizar o label de capítulo no modo púlpito

### Corrigido

- **Página `/changelog`:** listas com `display: flex` em cada item e texto + `` `código` `` geravam vários itens flex anónimos e texto em colunas estreitas; o conteúdo passa a ir num único `.changelog-item-body` (`flex: 1; min-width: 0`). A página lê o `CHANGELOG.md` real (`?raw`) com parser partilhado (`src/lib/changelogParser.js`, `src/pages/ChangelogPage.jsx`, estilos em `src/index.css`). `.app-main` com `min-width: 0` evita compressão lateral no layout flex. `changelog.html` (standalone): mesmo wrapper nos itens.

- **GitHub Pages:** o artefacto só continha `dist/` (Vite) e não incluía `db/`, `sw.js` nem `assets/images/`, causando 404 em `/db/books/pdf/pdf_index.json` (lista Livros PDF vazia), `sw.js` e ícones; o pós-build (`scripts/copy-static-for-pages.js` + `vite.config.js`) copia esses recursos para `dist/`. `manifest.json`: ícone com caminho absoluto `/assets/images/logo.png` para não duplicar `assets/` quando o manifest é emitido em `/assets/manifest-*.json`. `manifest.json` + `index.html`: favicon passa a apontar para `favicon.png` (existente no repositório). `sw.js`: precache alinhado ao shell da SPA React (evita `cache.addAll` com ficheiros legacy que não existem no deploy). `vite dev`: middleware `scripts/vite-dev-static.js` serve `db/`, `sw.js` e `assets/images/` como em produção.

- `.gitignore`: o padrão anterior (`.agents/`) impedia `git add` de `.agents/workflows/`; passa a ignorar o conteúdo de `.agents` com exceção explícita para `workflows/`, alinhado com o workflow de changelog referenciado em `.cursorrules`.

- Dev (Vite): porta do servidor alterada de `5173` para `2222` em ambiente local (`vite.config.js`)
- GitHub Pages: rotas diretas da SPA React (ex.: `/book/sl`) devolviam 404 — o build passa a gerar `404.html` idêntico ao `index.html` para o Pages servir a app nesses URLs (`vite.config.js`, `scripts/copy-spa-404.js`)
- Dev (Vite): removido `//# sourceMappingURL` de `assets/libs/dexie.min.js` — o ficheiro `dexie.min.js.map` não existia e o servidor emitia `ENOENT` ao tentar carregar o source map
- Dark mode: expandida a cobertura CSS para mais de 50 seletores (cards, topbar, sidebar, botões, selects, footer)
- Dark mode: adicionado suporte ao Bottom Nav e ao seletor de fontes

### Alterado

- Página **Sobre** (`/about`): versão a partir de `package.json`; cartões (dicionário na leitura, Cantor/Harpa, Livros PDF); texto de sublinhados atualizado; sem bloco de contribuição técnica na UI — orientações para desenvolvedores continuam em `.cursorrules` e `.agents/workflows/update-changelog.md` (`src/pages/AboutPage.jsx`, `src/index.css`).

- Regras do projeto: secção **Changelog** em `.cursorrules` reforçada como obrigatória após alterações relevantes; referência ao hook Husky e `SKIP_CHANGELOG`; workflow `.agents/workflows/update-changelog.md` com checklist e secção sobre o `pre-commit`.
- Página **Dicionário Bíblico**: carregamento das letras passa a usar o módulo compartilhado `loadLetterEntries` e `normalizeDictionaryKey`, com cache único em memória (`src/pages/DictionaryPage.jsx`, `src/lib/dictionaryData.js`).

- Estrutura: diretório `script/` removido; `generated_path.py` passa a estar em `scripts/` junto aos restantes scripts do projeto.
- Estrutura: scripts legacy da raiz (`/js`) migrados para `assets/js`; páginas HTML atualizadas para carregar os ficheiros no novo caminho.
- Leitura bíblica: modo de seleção múltipla de versículos agora também permite sublinhar/remover marcação em lote (além de compartilhar), agilizando marcações em sequência (`src/pages/BookPage.jsx`).
- Testes: adicionados cenários unitários para aplicação/remoção de sublinhado em múltiplos versículos (`tests/bookPage.test.js`).
- Leitura bíblica: adicionado botão **Intervalo** no modo de seleção múltipla para preencher automaticamente os versículos entre o menor e o maior selecionado (`src/pages/BookPage.jsx`).
- Testes: cobertura da expansão de seleção por intervalo (`tests/bookPage.test.js`).

---

## [1.5.0] — 2026-03-27

### Adicionado

- Redesign completo do Audio Player (`AudioPlayer.css`): tema claro elegante com acento índigo, barra de progresso com gradiente, playlist com hover e EQ animado
- Header branco em todas as páginas: `data-topbar` alterado de `colored` para `light`
- Bottom Navigation fixo para mobile em `index.html`, `book.html`, `bible_play.html`, `settings.html`
- Tipografia imersiva: Google Fonts (Merriweather, Lato, Playfair Display, Crimson Text) + seletor visual no painel de leitura

### Corrigido

- `player.html`: caminho do CSS `AudioPlayer.css` corrigido de `css/` para `assets/css/`
- Service Worker (`sw.js`): respostas HTTP 206 (streaming de áudio) agora ignoradas no cache, eliminando `TypeError: Failed to execute 'put' on 'Cache'`
- Item "Configurações" removido do menu lateral (`index.html`)

---

## [1.4.0] — 2026-03-27

### Adicionado

- Dark Mode completo em `book.html`: toggle no painel de configurações, persistência via `localStorage`, prevenção de FOUC com script inline
- Skeleton loader para listas de livros em `bible_play.html` (8 cards animados)
- Skeleton loader para texto bíblico em `book.html` (12 linhas shimmer)

### Corrigido

- `js/db.js`: `const` → `var` nas declarações globais para prevenir `SyntaxError: Identifier already declared` ao re-avaliar scripts via jQuery AJAX
- Service Worker (`sw.js`): estratégia alterada para Cache-First com Network Fallback, corrigindo `TypeError: Failed to execute 'clone' on 'Response': Response body is already used`

---

## [1.3.0] — 2026-03-27

### Adicionado

- Seleção de versão bíblica movida para o painel lateral de configurações de leitura (`book.html`)
- Seleção de versão persistida no IndexedDB via Dexie.js
- Nome da versão ativa exibido no título do livro

---

## [1.2.0] — 2026-03-26

### Adicionado

- PWA completo: Service Worker, Web App Manifest, ícones, `theme-color`
- Banco de dados IndexedDB com Dexie.js para preferências e progresso de leitura
- Salvar/restaurar último capítulo lido por livro
- Controles de tamanho de fonte (A- / A+) persistidos no banco

---

## [1.1.0] — 2026-03-25

### Adicionado

- Imagens ilustrativas de estudo por versículo com modal de visualização
- Painel lateral de configurações de leitura (`readingSettingsSidebar`)
- Skeleton loader para lista de livros (`bible_play.html`)
- Filtro de livros por nome no índice

---

## [1.0.0] — 2026-03-24

### Adicionado

- Primeiro commit: estrutura base da aplicação OnBible
- Visualização de bíblia por livro e capítulo
- Player de áudio bíblico com playlist por livro
- Menu lateral (drawer) com navegação entre seções
- Suporte a múltiplas traduções (PT-ACF, PT-NVI, PT-AA, EN-BBE, EN-KJV)
