import { useState } from 'react';
import { NavLink } from 'react-router-dom';

export default function Layout({ children, theme, setAppTheme }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={`app-layout${sidebarOpen ? '' : ' sidebar-collapsed'}`}>
      {/* Sidebar */}
      <aside className="app-sidebar">
        <nav className="sidebar-nav">
          <NavLink to="/"          end><i className="fas fa-book" />        <span>Bíblia</span></NavLink>
          <NavLink to="/markers"      ><i className="fas fa-bookmark" />    <span>Marcadores</span></NavLink>
          <NavLink to="/play"         ><i className="fas fa-headphones" />  <span>Bíblia Play</span></NavLink>
          <NavLink to="/settings"     ><i className="fas fa-cog" />         <span>Configurações</span></NavLink>
          <NavLink to="/changelog"    ><i className="fas fa-history" />     <span>Atualizações</span></NavLink>
        </nav>
      </aside>

      {/* Main */}
      <main className="app-main">
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(s => !s)}
          title={sidebarOpen ? 'Esconder menu' : 'Mostrar menu'}
        >
          <i className={`fas fa-${sidebarOpen ? 'angle-double-left' : 'angle-double-right'}`}></i>
        </button>
        {children}
      </main>

      {/* Bottom Nav (mobile) */}
      <nav className="bottom-nav">
        <ul>
          <li><NavLink to="/"       end><i className="fas fa-book" /><span>Bíblia</span></NavLink></li>
          <li><NavLink to="/markers"   ><i className="fas fa-bookmark" /><span>Marcas</span></NavLink></li>
          <li><NavLink to="/play"      ><i className="fas fa-headphones" /><span>Ouvir</span></NavLink></li>
          <li><NavLink to="/settings"  ><i className="fas fa-cog" /><span>Config.</span></NavLink></li>
        </ul>
      </nav>
    </div>
  );
}
