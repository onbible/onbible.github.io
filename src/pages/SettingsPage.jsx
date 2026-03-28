import { useState } from 'react';
import { DB, onBibleDB } from '../lib/db';
import { VERSIONS } from '../lib/bibleVersions';
import { useBibleData } from '../hooks/useBible';

const THEMES = [
  { key: 'light', label: 'Claro', icon: 'fa-sun',     color: '#f9fafb' },
  { key: 'sepia',  label: 'Sépia', icon: 'fa-book-open', color: '#f4ecd8' },
  { key: 'dark',  label: 'Escuro', icon: 'fa-moon',    color: '#12121f' },
];

const FONTS = [
  { key: "'Inter', sans-serif",          label: 'Inter' },
  { key: "'Merriweather', serif",        label: 'Merriweather' },
  { key: "'Lora', serif",                label: 'Lora' },
  { key: "'Noto Serif', serif",          label: 'Noto Serif' },
  { key: "'Georgia', serif",             label: 'Georgia' },
  { key: "'Roboto', sans-serif",         label: 'Roboto' },
  { key: "'Open Sans', sans-serif",      label: 'Open Sans' },
  { key: "system-ui, sans-serif",        label: 'Sistema' },
];

export default function SettingsPage({ theme, setAppTheme }) {
  const { version, changeVersion } = useBibleData();
  const [status, setStatus] = useState('');
  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem('reading_font_size') || '17', 10);
  });
  const [fontFamily, setFontFamily] = useState(() => {
    return localStorage.getItem('reading_font_family') || "'Inter', sans-serif";
  });

  const changeFontSize = (size) => {
    setFontSize(size);
    localStorage.setItem('reading_font_size', String(size));
    document.documentElement.style.setProperty('--reading-font-size', size + 'px');
  };

  const changeFontFamily = (ff) => {
    setFontFamily(ff);
    localStorage.setItem('reading_font_family', ff);
    document.documentElement.style.setProperty('--reading-font-family', ff);
  };

  const exportBackup = async () => {
    try {
      const data = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        db: {
          preferences:   await onBibleDB.preferences.toArray(),
          reading_state: await onBibleDB.reading_state.toArray(),
          notes:         await onBibleDB.notes.toArray(),
          highlights:    await onBibleDB.highlights.toArray(),
        },
        localStorage: {
          dark_mode:    localStorage.getItem('dark_mode'),
          app_theme:    localStorage.getItem('app_theme'),
          reading_font: localStorage.getItem('reading_font'),
          reading_font_size: localStorage.getItem('reading_font_size'),
          reading_font_family: localStorage.getItem('reading_font_family'),
        },
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `onbible_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('✅ Backup exportado com sucesso!');
    } catch (e) {
      setStatus('❌ Erro ao exportar: ' + e.message);
    }
  };

  const importBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.db || !data.version) throw new Error('Arquivo inválido.');
        if (!window.confirm('Isso substituirá TODOS os seus dados atuais. Continuar?')) return;
        await onBibleDB.preferences.clear();
        await onBibleDB.reading_state.clear();
        await onBibleDB.notes.clear();
        await onBibleDB.highlights.clear();
        if (data.db.preferences)   await onBibleDB.preferences.bulkAdd(data.db.preferences);
        if (data.db.reading_state) await onBibleDB.reading_state.bulkAdd(data.db.reading_state);
        if (data.db.notes)         await onBibleDB.notes.bulkAdd(data.db.notes);
        if (data.db.highlights)    await onBibleDB.highlights.bulkAdd(data.db.highlights);
        if (data.localStorage) {
          Object.entries(data.localStorage).forEach(([k, v]) => { if (v !== null) localStorage.setItem(k, v); });
        }
        setStatus('✅ Dados restaurados! Recarregando...');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        setStatus('❌ Erro ao importar: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <div className="page-header">
        <h1><i className="fas fa-cog" style={{ marginRight: '8px' }}></i>Configurações</h1>
      </div>
      <div style={{ padding: '20px 28px' }}>

        {/* Version selector */}
        <div className="settings-section">
          <h5><i className="fas fa-bible" style={{ marginRight: '6px' }}></i>Versão da Bíblia</h5>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>Escolha a tradução que deseja usar.</p>
          <select
            value={version}
            onChange={e => changeVersion(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '14px' }}
          >
            {Object.entries(VERSIONS).map(([key, v]) => (
              <option key={key} value={key}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* Backup / Restore */}
        <div className="settings-section">
          <h5><i className="fas fa-lock" style={{ marginRight: '6px' }}></i>Sincronização e Backup</h5>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Exporte suas notas, marcadores e configurações para um arquivo local, ou restaure um backup anterior. Seus dados ficam 100% no seu dispositivo.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={exportBackup}
              style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
            >
              <i className="fas fa-download" style={{ marginRight: '6px' }} />Exportar Backup
            </button>
            <label style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--primary)', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
              <i className="fas fa-upload" style={{ marginRight: '6px' }} />Importar Backup
              <input type="file" accept=".json" onChange={importBackup} style={{ display: 'none' }} />
            </label>
          </div>
          {status && <p style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600 }}>{status}</p>}
        </div>

        {/* Theme */}
        <div className="settings-section">
          <h5><i className="fas fa-palette" style={{ marginRight: '6px' }}></i>Aparência</h5>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>Escolha o tema de sua preferência.</p>
          <div className="theme-picker">
            {THEMES.map(t => (
              <button
                key={t.key}
                className={`theme-btn${theme === t.key ? ' active' : ''}`}
                onClick={() => setAppTheme(t.key)}
              >
                <span className="theme-preview" style={{ background: t.color }} />
                <i className={`fas ${t.icon}`} style={{ marginRight: '6px' }} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="settings-section">
          <h5><i className="fas fa-text-height" style={{ marginRight: '6px' }}></i>Tamanho da Fonte</h5>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>Ajuste o tamanho do texto bíblico.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => changeFontSize(Math.max(12, fontSize - 1))}
              className="font-size-btn"
            >
              <i className="fas fa-minus" />
            </button>
            <span style={{ fontSize: fontSize + 'px', fontWeight: 600, minWidth: '44px', textAlign: 'center' }}>{fontSize}px</span>
            <button
              onClick={() => changeFontSize(Math.min(28, fontSize + 1))}
              className="font-size-btn"
            >
              <i className="fas fa-plus" />
            </button>
          </div>
          <div style={{ marginTop: '10px' }}>
            <input
              type="range"
              min="12"
              max="28"
              value={fontSize}
              onChange={(e) => changeFontSize(+e.target.value)}
              className="font-size-slider"
            />
          </div>
          <p className="font-preview" style={{ fontSize: fontSize + 'px', fontFamily: fontFamily, lineHeight: 1.9, marginTop: '12px', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            No princípio, criou Deus os céus e a terra.
          </p>
        </div>

        {/* Font Family */}
        <div className="settings-section">
          <h5><i className="fas fa-font" style={{ marginRight: '6px' }}></i>Estilo da Fonte</h5>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>Escolha a fonte para a leitura bíblica.</p>
          <div className="font-family-picker">
            {FONTS.map(f => (
              <button
                key={f.key}
                className={`font-family-btn${fontFamily === f.key ? ' active' : ''}`}
                style={{ fontFamily: f.key }}
                onClick={() => changeFontFamily(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
