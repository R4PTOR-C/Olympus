import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API    = process.env.REACT_APP_API_BASE_URL;
const RADIUS = 36;
const CIRC   = 2 * Math.PI * RADIUS;

function MiniRing({ pct }) {
    const ref = useRef(null);

    useEffect(() => {
        if (!ref.current) return;
        ref.current.style.strokeDashoffset = CIRC;
        requestAnimationFrame(() => requestAnimationFrame(() => {
            if (ref.current) {
                ref.current.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(0.4,0,0.2,1)';
                ref.current.style.strokeDashoffset = CIRC * (1 - pct);
            }
        }));
    }, [pct]);

    const pctLabel = Math.round(pct * 100);

    return (
        <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
            <svg width="96" height="96" viewBox="0 0 96 96">
                {/* Glow track */}
                <circle cx="48" cy="48" r={RADIUS} fill="none" stroke="rgba(74,144,217,0.12)" strokeWidth="8" />
                {/* Track */}
                <circle cx="48" cy="48" r={RADIUS} fill="none" stroke="rgba(74,144,217,0.18)" strokeWidth="8" strokeDasharray="4 4" />
                {/* Progress */}
                <circle
                    ref={ref}
                    cx="48" cy="48" r={RADIUS}
                    fill="none"
                    stroke="#4A90D9"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={CIRC}
                    transform="rotate(-90 48 48)"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(74,144,217,0.6))' }}
                />
            </svg>
            {/* Texto central */}
            <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 0,
            }}>
                <span style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '1.4rem',
                    color: '#4A90D9',
                    lineHeight: 1,
                    letterSpacing: '0.03em',
                }}>{pctLabel}%</span>
                <span style={{ fontSize: '0.55rem', color: 'rgba(74,144,217,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>XP</span>
            </div>
        </div>
    );
}

export default function ConquistasCard({ userId }) {
    const navigate = useNavigate();
    const token    = localStorage.getItem('token');
    const [dados,  setDados]  = useState(null);

    useEffect(() => {
        if (!userId) return;
        fetch(`${API}/gamificacao/usuarios/${userId}/progresso`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.ok ? r.json() : null)
            .then(d => d && setDados(d))
            .catch(() => {});
    }, [userId, token]);

    if (!dados) return null;

    const completosHoje = dados.objetivos.filter(o => o.completo).length;

    return (
        <div onClick={() => navigate('/progresso')} style={S.card}>

            {/* Faixinha de fundo decorativa */}
            <div style={S.glowBg} />

            {/* Linha de topo */}
            <div style={S.topRow}>
                <span style={S.label}>Conquistas</span>
                <div style={S.topRight}>
                    {dados.streak_atual > 0 && (
                        <span style={S.streakBadge}>🔥 {dados.streak_atual} dias</span>
                    )}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,217,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6"/>
                    </svg>
                </div>
            </div>

            {/* Corpo principal */}
            <div style={S.body}>

                {/* Info esquerda */}
                <div style={S.infoWrap}>
                    <div style={S.nivelRow}>
                        <span style={S.nivelNum}>Nível {dados.nivel}</span>
                        <span style={S.nivelDot}>·</span>
                        <span style={S.nivelNome}>{dados.nivel_nome}</span>
                    </div>

                    {/* XP bar */}
                    <div style={S.xpBarWrap}>
                        <div style={S.xpBarTrack}>
                            <div style={{ ...S.xpBarFill, width: `${dados.pct_nivel * 100}%` }} />
                        </div>
                        <span style={S.xpText}>{dados.xp_no_nivel} / {dados.xp_para_proximo} XP</span>
                    </div>

                    {/* Objetivos chips */}
                    <div style={S.objRow}>
                        {dados.objetivos.map(obj => (
                            <div
                                key={obj.id}
                                style={{
                                    ...S.objChip,
                                    background: obj.completo
                                        ? 'rgba(46,204,113,0.12)'
                                        : 'rgba(74,144,217,0.08)',
                                    borderColor: obj.completo
                                        ? 'rgba(46,204,113,0.3)'
                                        : 'rgba(74,144,217,0.15)',
                                }}
                            >
                                <div style={{
                                    ...S.objDot,
                                    background: obj.completo ? '#2ECC71' : 'rgba(74,144,217,0.4)',
                                }} />
                                <span style={{
                                    ...S.objLabel,
                                    color: obj.completo ? '#2ECC71' : 'rgba(74,144,217,0.8)',
                                }}>+{obj.xp} XP</span>
                            </div>
                        ))}
                    </div>

                    <span style={S.objSummary}>
                        {completosHoje === 0
                            ? 'Nenhum objetivo completo hoje'
                            : `${completosHoje} de ${dados.objetivos.length} objetivos completos`}
                    </span>
                </div>

                {/* Ring direita */}
                <MiniRing pct={dados.pct_nivel} />
            </div>

        </div>
    );
}

const S = {
    card: {
        margin: '16px 16px 4px',
        padding: '16px 18px 18px',
        background: 'var(--color-surface)',
        border: '1px solid rgba(74,144,217,0.2)',
        borderRadius: 20,
        boxShadow: '0 4px 24px rgba(74,144,217,0.08), var(--color-shadow)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        position: 'relative',
        overflow: 'hidden',
    },
    glowBg: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 160,
        height: 160,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(74,144,217,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
    },
    topRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: '0.68rem',
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--color-text-dim)',
    },
    topRight: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    streakBadge: {
        fontSize: '0.72rem',
        fontWeight: 700,
        color: '#FF6B00',
        fontFamily: "'Barlow Condensed', sans-serif",
        letterSpacing: '0.04em',
    },
    body: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
    },
    infoWrap: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    nivelRow: {
        display: 'flex',
        alignItems: 'baseline',
        gap: 6,
    },
    nivelNum: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--color-accent)',
    },
    nivelDot: {
        color: 'var(--color-text-dim)',
        fontSize: '0.8rem',
    },
    nivelNome: {
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1.5rem',
        color: 'var(--color-text)',
        letterSpacing: '0.05em',
        lineHeight: 1,
    },
    xpBarWrap: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
    },
    xpBarTrack: {
        height: 5,
        background: 'var(--color-surface-3)',
        borderRadius: 99,
        overflow: 'hidden',
    },
    xpBarFill: {
        height: '100%',
        background: 'linear-gradient(90deg, #4A90D9, #6AAFF0)',
        borderRadius: 99,
        minWidth: 4,
        transition: 'width 1.1s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '0 0 8px rgba(74,144,217,0.4)',
    },
    xpText: {
        fontSize: '0.65rem',
        color: 'var(--color-text-dim)',
        letterSpacing: '0.02em',
    },
    objRow: {
        display: 'flex',
        gap: 5,
        flexWrap: 'wrap',
    },
    objChip: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        borderRadius: 99,
        border: '1px solid',
    },
    objDot: {
        width: 5,
        height: 5,
        borderRadius: '50%',
        flexShrink: 0,
    },
    objLabel: {
        fontSize: '0.62rem',
        fontWeight: 700,
        fontFamily: "'Barlow Condensed', sans-serif",
        letterSpacing: '0.04em',
    },
    objSummary: {
        fontSize: '0.68rem',
        color: 'var(--color-text-dim)',
        marginTop: -2,
    },
};
