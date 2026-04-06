import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';

// ── Mini garrafa (rAF driven) ─────────────────────────────────────────────────

const B_TOP  = 14;
const B_BOT  = 58;
const B_H    = B_BOT - B_TOP;
const B_PATH = "M11 2 L11 5 Q6 8 6 14 L5 56 Q5 61 10 61 L22 61 Q27 61 27 56 L26 14 Q26 8 21 5 L21 2 Z";
const C_PATH = "M10 0 Q10 -1 16 -1 Q22 -1 22 0 L22 2 L10 2 Z";

function MiniBottle({ percentual }) {
    const pct      = Math.min(Math.max(percentual, 0), 1);
    const targetY  = B_TOP + B_H * (1 - pct);
    const waterRef = useRef(null);
    const waveRef  = useRef(null);
    const curYRef  = useRef(B_BOT);
    const tgtYRef  = useRef(targetY);
    const phaseRef = useRef(0);
    const frameRef = useRef(null);

    useEffect(() => { tgtYRef.current = targetY; }, [targetY]);

    useEffect(() => {
        const tick = () => {
            const cur  = curYRef.current;
            const tgt  = tgtYRef.current;
            const next = Math.abs(cur - tgt) < 0.05 ? tgt : cur + (tgt - cur) * 0.07;
            curYRef.current = next;
            const y = next;

            if (waterRef.current) {
                waterRef.current.setAttribute('y', y);
                waterRef.current.setAttribute('height', Math.max(B_BOT - y + 4, 0));
            }
            phaseRef.current += 0.07;
            if (waveRef.current) {
                if (y < B_BOT - 2 && y > B_TOP) {
                    const ph = phaseRef.current;
                    let d = `M 6 ${y}`;
                    for (let x = 6; x <= 26; x += 2)
                        d += ` L ${x} ${y + Math.sin(x * 0.5 + ph) * 0.9}`;
                    d += ` L 26 ${B_BOT} L 6 ${B_BOT} Z`;
                    waveRef.current.setAttribute('d', d);
                    waveRef.current.setAttribute('display', '');
                } else {
                    waveRef.current.setAttribute('display', 'none');
                }
            }
            frameRef.current = requestAnimationFrame(tick);
        };
        frameRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameRef.current);
    }, []);

    return (
        <svg viewBox="0 0 32 66" style={{ width: 28, height: 58, flexShrink: 0 }}>
            <defs>
                <clipPath id="mini-clip">
                    <path d={B_PATH} />
                </clipPath>
                <linearGradient id="mini-water" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6EB0F5" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#2166b0" />
                </linearGradient>
            </defs>
            <path d={B_PATH} fill="rgba(74,144,217,0.08)" />
            <g clipPath="url(#mini-clip)">
                <rect ref={waterRef} x="0" y={B_BOT} width="32" height="0" fill="url(#mini-water)" />
                <path ref={waveRef} fill="rgba(110,176,245,0.45)" display="none" />
            </g>
            <path d={B_PATH} fill="none" stroke="rgba(74,144,217,0.55)" strokeWidth="1.2" />
            <path d={C_PATH} fill="rgba(74,144,217,0.45)" />
        </svg>
    );
}

// ── Widget ────────────────────────────────────────────────────────────────────

export default function AguaWidget() {
    const navigate       = useNavigate();
    const { userId }     = useContext(AuthContext);
    const token          = localStorage.getItem('token');

    const [consumido, setConsumido] = useState(0);
    const [meta,      setMeta]      = useState(2500);
    const [loading,   setLoading]   = useState(true);

    const pct      = Math.min(consumido / meta, 1);
    const restante = Math.max(meta - consumido, 0);
    const atingida = consumido >= meta;

    useEffect(() => {
        if (!userId) return;
        fetch(`${process.env.REACT_APP_API_BASE_URL}/agua/usuarios/${userId}/hoje`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                setConsumido(data.total || 0);
                setMeta(data.meta || 2500);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [userId, token]);

    const adicionar = async (e) => {
        e.stopPropagation();
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/agua/usuarios/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ml: 200 }),
            });
            if (res.ok) setConsumido(prev => Math.min(prev + 200, meta));
        } catch {}
    };

    if (loading) return null;

    return (
        <div style={S.wrap} onClick={() => navigate('/agua')}>
            <MiniBottle percentual={pct} />

            <div style={S.body}>
                <div style={S.topRow}>
                    <span style={S.titulo}>Hidratação</span>
                    {atingida
                        ? <span style={S.badge}>Meta atingida</span>
                        : <span style={S.restante}>{restante} ml restantes</span>
                    }
                </div>

                <div style={S.barOuter}>
                    <div style={S.barInner(pct)} />
                </div>

                <div style={S.bottomRow}>
                    <span style={S.ml}>{consumido} <span style={S.mlMeta}>/ {meta} ml</span></span>
                    <button style={S.btnAdd} onClick={adicionar}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        200 ml
                    </button>
                </div>
            </div>
        </div>
    );
}

const S = {
    wrap: {
        margin: '8px 20px 0',
        padding: '14px 16px',
        background: 'var(--h-bg)',
        border: '1px solid var(--h-border)',
        borderRadius: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
    },
    body: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
        minWidth: 0,
    },
    topRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titulo: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700,
        fontSize: '0.82rem',
        color: 'var(--h-text)',
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
    },
    restante: {
        fontSize: '0.72rem',
        color: 'var(--h-text-muted)',
    },
    badge: {
        fontSize: '0.68rem',
        fontWeight: 700,
        color: '#48BB78',
        background: 'rgba(72,187,120,0.12)',
        padding: '2px 7px',
        borderRadius: 99,
    },
    barOuter: {
        height: 5,
        background: 'var(--h-border)',
        borderRadius: 99,
        overflow: 'hidden',
    },
    barInner: (pct) => ({
        height: '100%',
        width: `${pct * 100}%`,
        background: 'linear-gradient(90deg, #4A90D9, #6EB0F5)',
        borderRadius: 99,
        transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
    }),
    bottomRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ml: {
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1.1rem',
        color: '#4A90D9',
        letterSpacing: '0.03em',
    },
    mlMeta: {
        fontSize: '0.75rem',
        color: 'var(--h-text-muted)',
        fontFamily: "'Barlow', sans-serif",
    },
    btnAdd: {
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        background: 'rgba(74,144,217,0.12)',
        border: '1px solid rgba(74,144,217,0.25)',
        borderRadius: 99,
        color: '#4A90D9',
        fontSize: '0.75rem',
        fontWeight: 700,
        fontFamily: "'Barlow', sans-serif",
        padding: '5px 10px',
        cursor: 'pointer',
        letterSpacing: '0.02em',
    },
};
