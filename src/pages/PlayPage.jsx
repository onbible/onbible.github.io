export default function PlayPage() {
  return (
    <>
      <div className="page-header">
        <h1><i className="fas fa-headphones" style={{ marginRight: '8px' }}></i>Bíblia Play</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Ouça a Bíblia narrada</p>
      </div>
      <div style={{ padding: '40px 28px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <i className="fas fa-headphones" style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }} />
        <p style={{ fontSize: '16px', marginBottom: '8px' }}>Player de Áudio em Migração</p>
        <p style={{ fontSize: '13px' }}>
          O player de áudio será migrado como componente React em breve.<br />
          Por enquanto, use a versão clássica.
        </p>
        <a href="/player.html" style={{ display: 'inline-block', marginTop: '16px', padding: '10px 24px', background: 'var(--primary)', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
          Abrir Player Clássico
        </a>
      </div>
    </>
  );
}
