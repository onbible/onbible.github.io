export default function AboutPage() {
  return (
    <>
      <div className="page-header">
        <h1><i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>Sobre</h1>
      </div>

      <div className="about-page">
        {/* Hero */}
        <div className="about-hero">
          <div className="about-logo">
            <i className="fas fa-bible" />
          </div>
          <h2 className="about-title">OnBible</h2>
          <p className="about-subtitle">Bíblia de Estudo Premium &mdash; Offline-First</p>
          <span className="about-version">v1.0.0</span>
        </div>

        <p className="about-description">
          O <strong>OnBible</strong> é uma aplicação bíblica completa construída como PWA
          (Progressive Web App), que funciona 100% offline após o primeiro acesso.
          O objetivo é oferecer a melhor experiência de estudo bíblico direto no navegador
          &mdash; sem necessidade de instalar nada, sem anúncios, sem coleta de dados.
          Todos os seus dados ficam armazenados localmente no seu dispositivo.
        </p>

        {/* ── Features ── */}
        <div className="about-section-title">
          <i className="fas fa-star" /> Funcionalidades
        </div>

        <div className="about-features">
          <div className="about-feature-card">
            <div className="about-feature-icon" style={{ background: '#e74c3c' }}>
              <i className="fas fa-book-open" />
            </div>
            <div className="about-feature-body">
              <h3>Leitura da Bíblia</h3>
              <p>66 livros com navegação por capítulos, grid estilo Tabela Periódica com categorização por cores, busca por livro e separação AT/NT.</p>
            </div>
          </div>

          <div className="about-feature-card">
            <div className="about-feature-icon" style={{ background: '#3498db' }}>
              <i className="fas fa-language" />
            </div>
            <div className="about-feature-body">
              <h3>5 Versões da Bíblia</h3>
              <p>Almeida Revisada (AA), Almeida Corrigida (ACF), Nova Versão Internacional (NVI), Basic English (BBE) e King James Version (KJV).</p>
            </div>
          </div>

          <div className="about-feature-card">
            <div className="about-feature-icon" style={{ background: '#f1c40f' }}>
              <i className="fas fa-search" />
            </div>
            <div className="about-feature-body">
              <h3>Busca na Bíblia Inteira</h3>
              <p>Pesquise por texto em todos os versículos com destaque de ocorrências, ou digite uma referência como &ldquo;João 3:16&rdquo; para ir direto à passagem.</p>
            </div>
          </div>

          <div className="about-feature-card">
            <div className="about-feature-icon" style={{ background: '#e67e22' }}>
              <i className="fas fa-highlighter" />
            </div>
            <div className="about-feature-body">
              <h3>Sublinhados Coloridos</h3>
              <p>Destaque versículos com 4 cores diferentes (amarelo, verde, azul, rosa). Popover flutuante para ação rápida.</p>
            </div>
          </div>

          <div className="about-feature-card">
            <div className="about-feature-icon" style={{ background: '#f59e0b' }}>
              <i className="fas fa-sticky-note" />
            </div>
            <div className="about-feature-body">
              <h3>Notas Pessoais</h3>
              <p>Adicione, edite e exclua anotações em qualquer versículo com modal temático. Ícone indicador nos versículos anotados.</p>
            </div>
          </div>

          <div className="about-feature-card">
            <div className="about-feature-icon" style={{ background: '#2ecc71' }}>
              <i className="fas fa-project-diagram" />
            </div>
            <div className="about-feature-body">
              <h3>Referências Cruzadas (TSK)</h3>
              <p>Painel de referências cruzadas baseado no Treasury of Scripture Knowledge, com versículos expandíveis e textos traduzidos.</p>
            </div>
          </div>

          <div className="about-feature-card">
            <div className="about-feature-icon" style={{ background: '#ef4444' }}>
              <i className="fas fa-image" />
            </div>
            <div className="about-feature-body">
              <h3>Ilustrações Bíblicas</h3>
              <p>Imagens por versículo com galeria de mídias. Visualização em tela cheia ao clicar.</p>
            </div>
          </div>

          <div className="about-feature-card">
            <div className="about-feature-icon" style={{ background: '#9b59b6' }}>
              <i className="fas fa-headphones" />
            </div>
            <div className="about-feature-body">
              <h3>Bíblia em Áudio</h3>
              <p>Player completo com todos os 66 livros narrados. Controle de velocidade (0.75x a 2x), volume, modo repetir, playlist por capítulos.</p>
            </div>
          </div>

          <div className="about-feature-card">
            <div className="about-feature-icon" style={{ background: '#1abc9c' }}>
              <i className="fas fa-calendar-check" />
            </div>
            <div className="about-feature-body">
              <h3>Plano de Leitura Anual</h3>
              <p>365 dias para ler a Bíblia completa. Progresso mensal e global com barras visuais. Marcação de dias concluídos.</p>
            </div>
          </div>

          <div className="about-feature-card">
            <div className="about-feature-icon" style={{ background: '#e84393' }}>
              <i className="fas fa-bookmark" />
            </div>
            <div className="about-feature-body">
              <h3>Marcadores</h3>
              <p>Página centralizada com todos os sublinhados e notas. Edite ou exclua anotações rapidamente. Navegação direta ao versículo.</p>
            </div>
          </div>

          <div className="about-feature-card">
            <div className="about-feature-icon" style={{ background: '#6c5ce7' }}>
              <i className="fas fa-file-export" />
            </div>
            <div className="about-feature-body">
              <h3>Backup e Restauração</h3>
              <p>Exporte todos os seus dados (notas, sublinhados, preferências) em arquivo JSON e restaure a qualquer momento.</p>
            </div>
          </div>

          <div className="about-feature-card">
            <div className="about-feature-icon" style={{ background: '#fd79a8' }}>
              <i className="fas fa-palette" />
            </div>
            <div className="about-feature-body">
              <h3>Personalização</h3>
              <p>3 temas (Claro, Sépia, Escuro), 8 famílias de fontes e tamanho ajustável de 12px a 28px para leitura confortável.</p>
            </div>
          </div>

          <div className="about-feature-card">
            <div className="about-feature-icon" style={{ background: '#10b981' }}>
              <i className="fas fa-download" />
            </div>
            <div className="about-feature-body">
              <h3>100% Offline</h3>
              <p>PWA instalável que funciona sem internet após o primeiro acesso. Todos os dados são armazenados localmente via IndexedDB.</p>
            </div>
          </div>
        </div>

        {/* Tech */}
        <div className="about-section-title">
          <i className="fas fa-code" /> Tecnologia
        </div>
        <div className="about-tech">
          <span className="about-tech-badge">React 19</span>
          <span className="about-tech-badge">Vite</span>
          <span className="about-tech-badge">Dexie.js</span>
          <span className="about-tech-badge">IndexedDB</span>
          <span className="about-tech-badge">PWA</span>
          <span className="about-tech-badge">Service Worker</span>
          <span className="about-tech-badge">Font Awesome</span>
        </div>

        {/* Footer */}
        <div className="about-footer">
          <p>Feito com <i className="fas fa-heart" style={{ color: '#ef4444' }}></i> para a glória de Deus.</p>
          <p className="about-footer-copy">OnBible &copy; {new Date().getFullYear()} &mdash; Código aberto</p>
        </div>
      </div>
    </>
  );
}
