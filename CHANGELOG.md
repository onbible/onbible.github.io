# Changelog — OnBible PWA

Todas as mudanças notáveis deste projeto são documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [Unreleased]

### Adicionado

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

- Dev (Vite): removido `//# sourceMappingURL` de `assets/libs/dexie.min.js` — o ficheiro `dexie.min.js.map` não existia e o servidor emitia `ENOENT` ao tentar carregar o source map
- Dark mode: expandida a cobertura CSS para mais de 50 seletores (cards, topbar, sidebar, botões, selects, footer)
- Dark mode: adicionado suporte ao Bottom Nav e ao seletor de fontes

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
