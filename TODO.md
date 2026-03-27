# Roadmap: Bíblia de Estudo Premium com IA (Offline-First)

Este documento consolida as sugestões arquiteturais, visuais e de funcionalidades que transformarão a aplicação atual em uma das **melhores Bíblias de Estudo do mercado**. O foco imbatível do projeto é ser uma aplicação nativa (PWA de funcionamento **100% offline**) e utilizar Inteligência Artificial que roda diretamente no dispositivo móvel do usuário sem depender da nuvem.

---

## 🚀 Funcionalidades Inovadoras (Features Locais)

- [ ] **Assistente LLM Nativo (Offline-First):** Integrar modelos de linguagem compactos que rodam puramente no navegador e celular da pessoa (via WebGPU usando WebLLM ou Transformers.js). Explicar versículos, história e contextos, tudo usando poder de processamento do próprio aparelho, sem precisar nunca de rede.
- [ ] **Gerador de Esboços de Pregação Autônomo:** Utilizar a IA no navegador para conectar versículos que o pastor destacou e estruturar automaticamente um sermão expositivo, protegendo a privacidade dele (nada vai para um servidor na internet).
- [ ] **Busca Semântica no Dispositivo:** Permitir pesquisa de conceitos complexos na Bíblia inteira ("*parábolas de Jesus sobre administração financeira*") construindo uma base de *embeddings* offline que busca por "sentido" ao invés de textos exatos.
- [ ] **Comparador de Versões (Split-Screen):** O estudante deve conseguir dividir a tela ao meio, com a versão NVI (entendimento) na esquerda e ACF (fidelidade clássica) na direita.
- [ ] **Dicionário Strong e Léxicos (Grego/Hebraico):** Destacar passagens sublinhadas que, ao serem clicadas, mostram as raízes etimológicas.
- [ ] **Referências Cruzadas Interativas:** Ao clicar num versículo (ex: Mateus 24:15), a aplicação deve abrir um painel rápido com o trecho citado do Antigo Testamento (ex: Daniel).

## 🏗️ Melhorias de Código e Arquitetura

- [x] **PWA Offline Obrigatório (Progressive Web App):** Este é o coração do App. Aprimorar o manifesto JSON e Service Workers profundos, garantindo que o download inicial guarde tudo local: imagens, `.json` da bíblia e os modelos/pesos das Inteligências Artificiais. 
- [x] **Banco de Dados no Frontend (IndexedDB):** Como os dados do usuário e recursos offlines ficarão pesados, salvar tudo no `localStorage` vai se tornar obsoleto. Migrar as rotinas de banco para Dexie.js (IndexedDB) tornará a experiência instantânea a longos prazos.
- [ ] **Migração de Framework Frontend:** Substituir os scripts soltos do jQuery por ferramentas estáticas modernas para Single Page Applications (SPAs) reativas (ex: **React, Next.js ou Vue**). 
- [ ] **Sincronização / Exportação Segura:** Substituir a nuvem tradicional por um mecanismo puro de persistência local, oferecendo aos pastores uma opção de exportar o progresso em um arquivo único (backup/restore).

## 🎨 UI/UX (Interface e Experiência do Usuário)

- [x] **Modo Noturno / Tema Escuro (Dark Mode):** Fundamental em leitores de formato longo para proteger as vistas do leitor no escuro.
- [ ] **Navegação Em Formato de App Móvel:** Otimizar o menu lateral esquerdo (drawer) e apostar em "Bottom Tabs" (Barra Inferior) na visão de celular para navegação amigável com um único polegar.
- [ ] **Tipografia Imersiva Personalizável:** Assim como fizemos com o tamanho de letras, adicionar botões para trocar estilos de fonte clássicos e de pregação na hora.
- [ ] **Modo "Pregação/Púlpito":** Uma interface limpa, de altíssimo contraste, onde o pastor aperta um botão que esconde temporariamente botões extras/notificações e deixa 100% da tela ocupada pela palavra.