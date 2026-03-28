import { useState } from 'react';
import { DB, onBibleDB } from '../lib/db';
import { VERSIONS } from '../lib/bibleVersions';
import { useBibleData } from '../hooks/useBible';

export default function SettingsPage({ theme, toggleTheme }) {
  const { version, changeVersion } = useBibleData();
  const [status, setStatus] = useState('');

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
          reading_font: localStorage.getItem('reading_font'),
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
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>Alterne entre o modo claro e escuro.</p>
          <button
            onClick={toggleTheme}
            style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
          >
            {theme === 'dark'
              ? <><i className="fas fa-sun" style={{ marginRight: '6px' }}></i>Mudar para Modo Claro</>
              : <><i className="fas fa-moon" style={{ marginRight: '6px' }}></i>Mudar para Modo Escuro</>
            }
          </button>
        </div>
      </div>
    </>
  );
}
