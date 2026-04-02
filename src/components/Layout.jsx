import { useState, useCallback, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import PwaInstallBanner from './PwaInstallBanner';

export default function Layout({ children, theme, setAppTheme }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pwaBannerVisible, setPwaBannerVisible] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  return (
    <div
      className={`app-layout${sidebarOpen ? '' : ' sidebar-collapsed'}${
        pwaBannerVisible ? ' with-pwa-banner' : ''
      }`}
    >
      <PwaInstallBanner onVisibilityChange={setPwaBannerVisible} />
      {/* Sidebar */}
      <aside className="app-sidebar">
        <nav className="sidebar-nav">
          <NavLink to="/"          end><i className="fas fa-home" />        <span>Início</span></NavLink>
          <NavLink to="/bible"        ><i className="fas fa-bible" />       <span>Bíblia</span></NavLink>
          <NavLink to="/markers"      ><i className="fas fa-bookmark" />    <span>Marcadores</span></NavLink>
          <NavLink to="/plan"         ><i className="fas fa-calendar-check" /><span>Plano de Leitura</span></NavLink>
          <NavLink to="/play"         ><i className="fas fa-headphones" />  <span>Bíblia Play</span></NavLink>
          <NavLink to="/sermons"      ><i className="fas fa-scroll" />      <span>Sermões</span></NavLink>
          <NavLink to="/projector"    ><i className="fas fa-tv" />          <span>Projeção</span></NavLink>
          <NavLink to="/dictionary"   ><i className="fas fa-book-open" />   <span>Dicionário</span></NavLink>
          <NavLink to="/concordance" ><i className="fas fa-search-plus" /> <span>Concordância</span></NavLink>
          <NavLink to="/hymnal"       ><i className="fas fa-music" />       <span>Cantor Cristão</span></NavLink>
          <NavLink to="/harpa"        ><i className="fas fa-guitar" />      <span>Harpa Cristã</span></NavLink>
          <NavLink to="/books"        ><i className="fas fa-book-reader" /> <span>Livros PDF</span></NavLink>
          <NavLink to="/settings"     ><i className="fas fa-cog" />         <span>Configurações</span></NavLink>
          <NavLink to="/changelog"    ><i className="fas fa-history" />     <span>Atualizações</span></NavLink>
          <NavLink to="/about"        ><i className="fas fa-info-circle" /> <span>Sobre</span></NavLink>
        </nav>
      </aside>

      {/* Main */}
      <main className="app-main">
        <div className="app-main-toolbar">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(s => !s)}
            title={sidebarOpen ? 'Esconder menu' : 'Mostrar menu'}
          >
            <i className={`fas fa-${sidebarOpen ? 'angle-double-left' : 'angle-double-right'}`}></i>
          </button>
          <button
            className="fullscreen-toggle"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          >
            <i className={`fas fa-${isFullscreen ? 'compress' : 'expand'}`}></i>
          </button>
        </div>
        {children}
      </main>

      {/* Bottom Nav (mobile) */}
      <nav className="bottom-nav">
        <ul>
          <li><NavLink to="/"       end><i className="fas fa-home" /><span>Início</span></NavLink></li>
          <li><NavLink to="/bible"     ><i className="fas fa-bible" /><span>Bíblia</span></NavLink></li>
          <li><NavLink to="/markers"   ><i className="fas fa-bookmark" /><span>Marcas</span></NavLink></li>
          <li><NavLink to="/plan"      ><i className="fas fa-calendar-check" /><span>Plano</span></NavLink></li>
          <li><NavLink to="/play"      ><i className="fas fa-headphones" /><span>Ouvir</span></NavLink></li>
          <li><NavLink to="/sermons"  ><i className="fas fa-scroll" /><span>Sermões</span></NavLink></li>
          <li><NavLink to="/settings"  ><i className="fas fa-cog" /><span>Config.</span></NavLink></li>
        </ul>
      </nav>
    </div>
  );
}
