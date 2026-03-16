import React, { useEffect, useState } from 'react';
import '../../styles/ModalSucesso.css';

const R = 50;
const CIRC = 2 * Math.PI * R;
const DURATION_MS = 3000;

const ModalSucesso = ({ show, mensagem = "Treino finalizado!" }) => {
    const [progress, setProgress] = useState(1);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (show) {
            setProgress(1);
            setVisible(true);

            const start = performance.now();
            let raf;
            const tick = (now) => {
                const p = Math.max(0, 1 - (now - start) / DURATION_MS);
                setProgress(p);
                if (p > 0) raf = requestAnimationFrame(tick);
            };
            raf = requestAnimationFrame(tick);
            return () => cancelAnimationFrame(raf);
        } else {
            setVisible(false);
        }
    }, [show]);

    if (!visible) return null;

    const cx = R + 10, cy = R + 10;

    return (
        <div className="ms-overlay">
            <div className="ms-card">

                {/* ── ÍCONE ── */}
                <div className="ms-icon-wrap">
                    <div className="ms-glow" />
                    <svg width={R * 2 + 20} height={R * 2 + 20}
                        viewBox={`0 0 ${R * 2 + 20} ${R * 2 + 20}`}>
                        <circle cx={cx} cy={cy} r={R} className="ms-ring-track" />
                        <circle cx={cx} cy={cy} r={R}
                            className="ms-ring-arc"
                            strokeDasharray={CIRC}
                            transform={`rotate(-90 ${cx} ${cy})`}
                        />
                        <polyline
                            points={`${cx - 18},${cy} ${cx - 5},${cy + 13} ${cx + 20},${cy - 15}`}
                            className="ms-checkmark"
                        />
                    </svg>
                </div>

                {/* ── TEXTO ── */}
                <span className="ms-title">TREINO</span>
                <span className="ms-title ms-title-accent">FINALIZADO</span>
                <p className="ms-sub">Excelente trabalho hoje!</p>

                {/* ── BARRA DE AUTO-DISMISS ── */}
                <div className="ms-bar-track">
                    <div className="ms-bar-fill" style={{ width: `${progress * 100}%` }} />
                </div>
            </div>
        </div>
    );
};

export default ModalSucesso;
