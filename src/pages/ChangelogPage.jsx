export default function ChangelogPage() {
  const entries = [
    {
      version: '[Unreleased]',
      items: [
        'Referências Cruzadas Interativas: painel ao final dos versículos (TSK)',
        'Sistema de Backup e Restauração local via arquivo JSON',
        'Gerenciamento de Notas nos Versículos com ícone indicador',
        'Página "Meus Marcadores": visualização de sublinhados e notas',
        'Migração de Framework Frontend: jQuery → React + Vite (SPA)',
        'Modo Pregação/Púlpito: tela imersiva fullscreen',
        'Seletor de tipografia com 4 estilos persistido',
      ]
    },
    {
      version: 'v2.5 — Highlights & Notes',
      items: [
        'Marcação de versículos com 4 cores (amarelo, verde, azul, rosa)',
        'Persistência de highlights via IndexedDB (Dexie.js)',
        'Menu flutuante de marcação com ícones premium',
      ]
    },
    {
      version: 'v2.0 — IndexedDB Migration',
      items: [
        'Migração de localStorage para IndexedDB via Dexie.js',
        'Preferências de versão e progresso de leitura persistidos',
      ]
    },
    {
      version: 'v1.0 — MVP',
      items: [
        'Leitura das 5 versões da Bíblia (PT-AA, PT-ACF, PT-NVI, EN-BBE, EN-KJV)',
        'Navegação por capítulos e livros',
        'PWA installable (offline-first)',
        'Player de áudio bíblico',
      ]
    }
  ];

  return (
    <>
      <div className="page-header">
        <h1><i className="fas fa-clipboard-list" style={{ marginRight: '8px' }}></i>Atualizações</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Histórico de funcionalidades do OnBible</p>
      </div>
      <div style={{ padding: '20px 28px' }}>
        {entries.map(entry => (
          <div key={entry.version} style={{ marginBottom: '28px' }}>
            <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginBottom: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
              {entry.version}
            </h5>
            <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {entry.items.map((item, i) => (
                <li key={i} style={{ fontSize: '14px', lineHeight: '1.5' }}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
