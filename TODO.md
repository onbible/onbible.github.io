# Roadmap: Bíblia de Estudo Premium com IA

Este documento consolida as sugestões arquiteturais, visuais e de funcionalidades que transformarão a aplicação atual em uma das **melhores Bíblias de Estudo do mercado**, focada na preparação de pregações, devocionais profundos e análises exegéticas usando inteligência artificial e NLP.

---

## 🚀 Funcionalidades Inovadoras (Features)

- [ ] **Integração Básica de IA (LLM Assistant):** Adicionar um assistente flutuante ou um botão "Explicar Versículo" (usualmente um ícone de "brilho" ✨) que chama uma API LLM (ex: Gemini/OpenAI) fornecendo o capítulo atual para tirar dúvidas teológicas.
- [ ] **Gerador de Esboços de Pregação:** Usar LLM para interpretar os versículos que o usuário destacou e automaticamente gerar uma estrutura básica de sermão expositivo (Introdução, Tópicos, Conclusão).
- [ ] **Busca Semântica (NLP):** Permitir que o usuário pesquise conceitos profundos ("*versículos sobre a dualidade entre corpo e alma*", "*parábolas de Jesus sobre administração financeira*") e a IA retorne não palavras iguais, mas o sentido exato da busca.
- [ ] **Comparador de Versões (Split-Screen):** O estudante deve conseguir dividir a tela ao meio, com a versão NVI (entendimento) na esquerda e ACF (fidelidade clássica) na direita.
- [ ] **Notas e Destaques (Highlighting):** Sistema nativo permitindo que ele clique num versículo, risque de amarelo/verde/vermelho, e digite pequenas notas atreladas especificamente ali.
- [ ] **Dicionário Strong e Léxicos (Grego/Hebraico):** Destacar passagens sublinhadas que, ao serem clicadas, mostram as raízes etimológicas.
- [ ] **Referências Cruzadas Interativas:** Ao clicar num versículo (ex: Mateus 24:15), a aplicação deve abrir um painel rápido com o trecho citado do Antigo Testamento (ex: Daniel).

## 🏗️ Melhorias de Código e Arquitetura

- [ ] **Migração de Framework Frontend:** O código atual utiliza HTML estático e jQuery de forma procedural. O próximo grande salto seria refatorar as telas num framework reativo moderno (ex: **React**, **Next.js** ou **Vue**). Isso traria componentes reaproveitáveis, carregamento virtual e manutenção robusta.
- [ ] **Banco de Dados no Frontend (IndexedDB via Dexie.js):** Fazer download constante de arquivos `.json` de traduções completas demanda muita rede. Utilizar o *IndexedDB* na carga inicial para gravar cada livro localmente traria a velocidade do clique a incríveis 0ms (mesmo no modo avião).
- [ ] **Integração Back-End Leve (Serverless):** Para proteger chaves de IA (OpenAI API key) e armazenar anotações na nuvem, uma arquitetura Serverless baseada em Firebase, Supabase ou Cloudfare Workers pode ser adicionada gratuitamente.
- [ ] **PWA Completo (Progressive Web App):** Aprimorar o manifesto JSON e adicionar Service Workers profundos, para que pastores nos púlpitos usem o projeto de forma instalada no Android/iOS 100% offline.

## 🎨 UI/UX (Interface e Experiência do Usuário)

- [ ] **Modo Noturno / Tema Escuro (Dark Mode):** Fundamental em leitores de formato longo. Precisa de um botão na barra de configurações que inverta as variáveis de cor para proteger as vistas.
- [ ] **Navegação Em Formato de App Móvel:** Otimizar o menu lateral esquerdo (drawer) e apostar mais em "Bottom Tabs" (Barra Inferior) quando acessado via celular, onde os polegares do usuário alcançam mais fácil.
- [ ] **Tipografia Imersiva Personalizável:** Assim como fizemos os botões `A-` e `A+`, adicionar seletores de família de fontes (ex: *Lora, Merriweather* para ar de pergaminho clássico vs. *Inter, Roboto* para alta legibilidade).
- [ ] **Modo "Pregação/Púlpito":** Uma interface limpa, onde as notas somem, a cor da letra fica incrivelmente contrastada (como num Kindle Paperwhite) e a rolagem automática mantém a concentração no sermão sem notificações ou botões laterais poluindo a tela.