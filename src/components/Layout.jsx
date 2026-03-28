import { NavLink } from 'react-router-dom';

export default function Layout({ children, theme, toggleTheme }) {
  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <img src="/assets/images/logo.png" alt="OnBible" />
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/"          end><i className="fas fa-book" />        <span>Bíblia</span></NavLink>
          <NavLink to="/markers"      ><i className="fas fa-bookmark" />    <span>Marcadores</span></NavLink>
          <NavLink to="/play"         ><i className="fas fa-headphones" />  <span>Bíblia Play</span></NavLink>
          <NavLink to="/settings"     ><i className="fas fa-cog" />         <span>Configurações</span></NavLink>
          <NavLink to="/changelog"    ><i className="fas fa-history" />     <span>Atualizações</span></NavLink>
        </nav>
        <div style={{ position: 'absolute', bottom: '16px', left: 0, right: 0, padding: '0 16px' }}>
          <button
            onClick={toggleTheme}
            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer', fontSize: '13px' }}
          >
            {theme === 'dark' ? <><i className="fas fa-sun" style={{ marginRight: '6px' }}></i>Modo Claro</> : <><i className="fas fa-moon" style={{ marginRight: '6px' }}></i>Modo Escuro</>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="app-main">
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
