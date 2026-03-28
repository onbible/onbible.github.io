import { useRef, useCallback } from 'react';

/**
 * Renders a beautiful Bible Reading Plan certificate and allows download as PNG.
 * Props:
 *  - userName: string
 *  - year: number
 *  - onClose: () => void
 */
export default function ReadingCertificate({ userName, year, onClose }) {
  const canvasRef = useRef(null);

  const drawCertificate = useCallback((canvas) => {
    if (!canvas) return;
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d');
    const W = 1200;
    const H = 850;
    canvas.width = W;
    canvas.height = H;

    // --- Background ---
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#fdf6e3');
    bgGrad.addColorStop(0.5, '#fff8ef');
    bgGrad.addColorStop(1, '#f5eed6');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // --- Decorative gold border ---
    const borderWidth = 16;
    ctx.strokeStyle = '#c9a84c';
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(borderWidth / 2, borderWidth / 2, W - borderWidth, H - borderWidth);

    // Inner border
    ctx.strokeStyle = '#b8943f';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, W - 60, H - 60);
    ctx.strokeRect(36, 36, W - 72, H - 72);

    // --- Corner ornaments ---
    drawCornerOrnament(ctx, 44, 44, 1, 1);
    drawCornerOrnament(ctx, W - 44, 44, -1, 1);
    drawCornerOrnament(ctx, 44, H - 44, 1, -1);
    drawCornerOrnament(ctx, W - 44, H - 44, -1, -1);

    // --- Cross at top center ---
    const crossX = W / 2;
    const crossY = 90;
    ctx.save();
    ctx.strokeStyle = '#c9a84c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(crossX, crossY - 22);
    ctx.lineTo(crossX, crossY + 22);
    ctx.moveTo(crossX - 14, crossY - 6);
    ctx.lineTo(crossX + 14, crossY - 6);
    ctx.stroke();
    // Glow
    ctx.shadowColor = '#c9a84c';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(crossX, crossY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#c9a84c';
    ctx.fill();
    ctx.restore();

    // --- Title ---
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6b4f1d';
    ctx.font = '700 14px "Georgia", serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('CERTIFICADO DE', W / 2, 145);

    ctx.fillStyle = '#3e2c1c';
    ctx.font = '700 42px "Georgia", serif';
    ctx.fillText('Leitura da Bíblia', W / 2, 198);

    // --- Decorative line ---
    drawDecorativeLine(ctx, W / 2, 220, 320);

    // --- Body text ---
    ctx.fillStyle = '#5a4530';
    ctx.font = '400 17px "Georgia", serif';
    ctx.fillText('Certificamos que', W / 2, 274);

    // --- Name ---
    ctx.fillStyle = '#2d1810';
    ctx.font = '700 36px "Georgia", serif';
    ctx.fillText(userName || 'Servo(a) de Deus', W / 2, 324);

    // Name underline
    const nameWidth = ctx.measureText(userName || 'Servo(a) de Deus').width;
    ctx.strokeStyle = '#c9a84c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W / 2 - nameWidth / 2 - 20, 334);
    ctx.lineTo(W / 2 + nameWidth / 2 + 20, 334);
    ctx.stroke();

    // --- Completion text ---
    ctx.fillStyle = '#5a4530';
    ctx.font = '400 17px "Georgia", serif';
    ctx.fillText(`completou com dedicação e fé a leitura integral da`, W / 2, 380);

    ctx.font = '700 22px "Georgia", serif';
    ctx.fillStyle = '#3e2c1c';
    ctx.fillText('Sagrada Escritura', W / 2, 416);

    ctx.font = '400 17px "Georgia", serif';
    ctx.fillStyle = '#5a4530';
    ctx.fillText(`no Plano de Leitura Anual — ${year}`, W / 2, 452);

    // --- Decorative line ---
    drawDecorativeLine(ctx, W / 2, 478, 260);

    // --- Verse ---
    ctx.font = 'italic 15px "Georgia", serif';
    ctx.fillStyle = '#7a6652';
    ctx.fillText('"Bem-aventurado aquele que lê e aqueles que ouvem as palavras', W / 2, 522);
    ctx.fillText('desta profecia e guardam as coisas que nela estão escritas."', W / 2, 544);
    ctx.font = '700 13px "Georgia", serif';
    ctx.fillStyle = '#8b5e34';
    ctx.fillText('— Apocalipse 1:3', W / 2, 570);

    // --- Olive branches ---
    drawOliveBranch(ctx, W / 2 - 180, 610, false);
    drawOliveBranch(ctx, W / 2 + 180, 610, true);

    // --- Seal / stamp ---
    drawSeal(ctx, W / 2, 660, 50);

    // --- Date ---
    const dateStr = new Date().toLocaleDateString('pt-BR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    ctx.fillStyle = '#7a6652';
    ctx.font = '400 13px "Georgia", serif';
    ctx.fillText(dateStr, W / 2, 746);

    // --- App name ---
    ctx.fillStyle = '#b8943f';
    ctx.font = '700 11px "Georgia", serif';
    ctx.fillText('OnBible — Bíblia de Estudo', W / 2, 780);

    // --- Stars ---
    drawStar(ctx, W / 2 - 140, 780, 4, '#c9a84c');
    drawStar(ctx, W / 2 + 140, 780, 4, '#c9a84c');
  }, [userName, year]);

  // --- Download ---
  const downloadCertificate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Certificado_Leitura_Biblia_${year}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [year]);

  return (
    <div className="cert-overlay" onClick={onClose}>
      <div className="cert-container" onClick={e => e.stopPropagation()}>
        <button className="cert-close" onClick={onClose}>
          <i className="fas fa-times" />
        </button>
        <canvas ref={drawCertificate} className="cert-canvas" />
        <div className="cert-actions">
          <button className="cert-download-btn" onClick={downloadCertificate}>
            <i className="fas fa-download" /> Baixar Certificado
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Drawing helpers ────────────────────────────────────────────────────────

function drawCornerOrnament(ctx, x, y, dx, dy) {
  ctx.save();
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx * 40, y);
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + dy * 40);
  // Arc detail
  ctx.moveTo(x + dx * 14, y + dy * 14);
  ctx.arc(x + dx * 10, y + dy * 10, 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawDecorativeLine(ctx, cx, y, halfW) {
  ctx.save();
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - halfW, y);
  ctx.lineTo(cx + halfW, y);
  ctx.stroke();
  // Diamond at center
  ctx.fillStyle = '#c9a84c';
  ctx.beginPath();
  ctx.moveTo(cx, y - 5);
  ctx.lineTo(cx + 5, y);
  ctx.lineTo(cx, y + 5);
  ctx.lineTo(cx - 5, y);
  ctx.closePath();
  ctx.fill();
  // Small diamonds at ends
  [cx - halfW + 10, cx + halfW - 10].forEach(dx => {
    ctx.beginPath();
    ctx.moveTo(dx, y - 3);
    ctx.lineTo(dx + 3, y);
    ctx.lineTo(dx, y + 3);
    ctx.lineTo(dx - 3, y);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
}

function drawOliveBranch(ctx, x, y, mirror) {
  ctx.save();
  ctx.translate(x, y);
  if (mirror) ctx.scale(-1, 1);
  ctx.strokeStyle = '#8b9e6b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-40, -20, -80, -10);
  ctx.stroke();

  // Leaves
  const leaves = [
    { x: -15, y: -6 }, { x: -30, y: -14 }, { x: -45, y: -16 },
    { x: -58, y: -14 }, { x: -70, y: -11 },
  ];
  ctx.fillStyle = '#8b9e6b';
  leaves.forEach((l, i) => {
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.rotate((i % 2 === 0 ? -0.3 : 0.4) + i * 0.08);
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}

function drawSeal(ctx, cx, cy, r) {
  ctx.save();
  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 3;
  ctx.stroke();
  // Inner ring
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
  ctx.lineWidth = 1;
  ctx.stroke();
  // Fill
  const sealGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  sealGrad.addColorStop(0, 'rgba(201,168,76,0.15)');
  sealGrad.addColorStop(1, 'rgba(201,168,76,0.05)');
  ctx.fillStyle = sealGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
  ctx.fill();
  // Cross inside
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 18);
  ctx.lineTo(cx, cy + 18);
  ctx.moveTo(cx - 12, cy - 4);
  ctx.lineTo(cx + 12, cy - 4);
  ctx.stroke();
  // Text
  ctx.fillStyle = '#c9a84c';
  ctx.font = '700 8px "Georgia", serif';
  ctx.textAlign = 'center';
  ctx.fillText('COMPLETO', cx, cy + 32);
  ctx.restore();
}

function drawStar(ctx, x, y, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const px = x + r * Math.cos(angle);
    const py = y + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
