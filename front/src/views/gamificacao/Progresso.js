import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../../AuthContext';
import PageStateHandler from '../components/PageStateHandler';

const API = process.env.REACT_APP_API_BASE_URL;

// ── SVG Ring ─────────────────────────────────────────────────────────────────
const RADIUS = 52;
const CIRC   = 2 * Math.PI * RADIUS; // ~326.7

function XpRing({ pct, xpNoNivel, xpParaProximo, nivelNome }) {
    const ringRef = useRef(null);

    useEffect(() => {
        if (!ringRef.current) return;
        // Anima do zero até o valor alvo
        ringRef.current.style.strokeDashoffset = CIRC;
        const target = CIRC * (1 - pct);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (ringRef.current) {
                    ringRef.current.style.transition = 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)';
                    ringRef.current.style.strokeDashoffset = target;
                }
            });
        });
    }, [pct]);

    return (
        <div style={S.ringWrap}>
            <svg width="140" height="140" viewBox="0 0 140 140">
                {/* Track */}
                <circle
                    cx="70" cy="70" r={RADIUS}
                    fill="none"
                    stroke="var(--color-surface-3)"
                    strokeWidth="10"
                />
                {/* Progress */}
                <circle
                    ref={ringRef}
                    cx="70" cy="70" r={RADIUS}
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={CIRC}
                    transform="rotate(-90 70 70)"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(74,144,217,0.5))' }}
                />
            </svg>
            {/* Texto central */}
            <div style={S.ringCenter}>
                <span style={S.ringXp}>{xpNoNivel}</span>
                <span style={S.ringTotal}>/ {xpParaProximo} XP</span>
            </div>
        </div>
    );
}

// ── Ícones dos objetivos ──────────────────────────────────────────────────────
function IconeObjetivo({ tipo, cor }) {
    const s = { width: 20, height: 20 };
    if (tipo === 'dumbbell') return (
        <svg {...s} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4v16M18 4v16M8 8h8M8 16h8M4 6h4M4 18h4M16 6h4M16 18h4"/>
        </svg>
    );
    if (tipo === 'water') return (
        <svg {...s} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6 9 4 13.5 4 16a8 8 0 0 0 16 0c0-2.5-2-7-8-14z"/>
        </svg>
    );
    if (tipo === 'fire') return (
        <svg {...s} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
        </svg>
    );
    if (tipo === 'calendar') return (
        <svg {...s} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
    );
    return null;
}

// ── Card de objetivo ──────────────────────────────────────────────────────────
function CardObjetivo({ obj, index }) {
    const pct     = Math.min(obj.progresso / obj.total, 1);
    const cor     = obj.completo ? 'var(--color-green)' : 'var(--color-accent)';
    const barCor  = obj.completo ? 'var(--color-green)' : 'var(--color-accent)';

    return (
        <div
            style={{
                ...S.card,
                animation: `fadeIn 0.3s ease both`,
                animationDelay: `${index * 0.07}s`,
                borderColor: obj.completo ? 'rgba(46,204,113,0.2)' : 'var(--color-border)',
            }}
        >
            {/* Ícone */}
            <div style={{ ...S.cardIcon, background: obj.completo ? 'rgba(46,204,113,0.1)' : 'var(--color-accent-dim)' }}>
                <IconeObjetivo tipo={obj.icone} cor={cor} />
            </div>

            {/* Info */}
            <div style={S.cardInfo}>
                <div style={S.cardRow}>
                    <span style={S.cardNome}>{obj.nome}</span>
                    <span style={{ ...S.xpBadge, background: obj.completo ? 'rgba(46,204,113,0.12)' : 'var(--color-accent-dim)', color: obj.completo ? 'var(--color-green)' : 'var(--color-accent)' }}>
                        +{obj.xp} XP
                    </span>
                </div>
                <div style={S.cardDesc}>{obj.descricao}</div>

                {/* Barra de progresso */}
                <div style={S.barTrack}>
                    <div style={{
                        ...S.barFill,
                        width: `${pct * 100}%`,
                        background: barCor,
                        boxShadow: obj.completo ? '0 0 8px rgba(46,204,113,0.4)' : 'none',
                        transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                </div>

                <span style={S.cardProg}>
                    {obj.completo ? '✓ Completo' : `${obj.progresso} / ${obj.total}`}
                </span>
            </div>
        </div>
    );
}

// ── Tela principal ────────────────────────────────────────────────────────────
export default function Progresso() {
    const { userId } = useContext(AuthContext);
    const token = localStorage.getItem('token');
    const [dados, setDados] = useState(null);

    useEffect(() => {
        if (!userId) return;
        fetch(`${API}/gamificacao/usuarios/${userId}/progresso`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(setDados)
            .catch(() => {});
    }, [userId, token]);

    if (!dados) return (
        <PageStateHandler>
            <div style={S.page}>
                <div style={S.loadWrap}>
                    {[140, 60, 60, 60].map((w, i) => (
                        <div key={i} style={{ ...S.skel, width: w, height: i === 0 ? 140 : 72, borderRadius: i === 0 ? '50%' : 14, animationDelay: `${i * 0.1}s` }} />
                    ))}
                </div>
            </div>
        </PageStateHandler>
    );

    return (
        <PageStateHandler>
            <div style={S.page}>

                {/* Header */}
                <div style={S.header}>
                    <span style={S.titulo}>Progresso</span>
                    <span style={S.streakBadge}>
                        🔥 {dados.streak_atual} dias
                    </span>
                </div>

                {/* Ring de XP */}
                <div style={S.ringSection}>
                    <XpRing
                        pct={dados.pct_nivel}
                        xpNoNivel={dados.xp_no_nivel}
                        xpParaProximo={dados.xp_para_proximo}
                        nivelNome={dados.nivel_nome}
                    />
                    <div style={S.nivelInfo}>
                        <span style={S.nivelNum}>Nível {dados.nivel}</span>
                        <span style={S.nivelNome}>{dados.nivel_nome}</span>
                        <span style={S.xpTotal}>{dados.xp_total} XP no total</span>
                    </div>
                </div>

                {/* Objetivos */}
                <div style={S.section}>
                    <span style={S.sectionLabel}>Objetivos</span>
                    <div style={S.cardList}>
                        {dados.objetivos.map((obj, i) => (
                            <CardObjetivo key={obj.id} obj={obj} index={i} />
                        ))}
                    </div>
                </div>

            </div>
        </PageStateHandler>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
    page: {
        minHeight: '100dvh',
        background: 'var(--color-bg)',
        padding: '24px 16px 80px',
        fontFamily: "'Barlow', sans-serif",
        maxWidth: 480,
        margin: '0 auto',
    },
    loadWrap: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        paddingTop: 40,
    },
    skel: {
        background: 'var(--color-surface-2)',
        animation: 'fadeIn 1s ease infinite alternate',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
    },
    titulo: {
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1.8rem',
        color: 'var(--color-text)',
        letterSpacing: '0.05em',
    },
    streakBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: 'rgba(255, 107, 0, 0.1)',
        border: '1px solid rgba(255, 107, 0, 0.25)',
        borderRadius: 99,
        padding: '5px 12px',
        fontSize: '0.8rem',
        fontWeight: 700,
        color: '#FF6B00',
        fontFamily: "'Barlow Condensed', sans-serif",
        letterSpacing: '0.04em',
    },
    ringSection: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        marginBottom: 36,
        padding: '28px 20px',
        background: 'var(--color-surface)',
        borderRadius: 20,
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--color-shadow)',
    },
    ringWrap: {
        position: 'relative',
        width: 140,
        height: 140,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringCenter: {
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
    },
    ringXp: {
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1.8rem',
        color: 'var(--color-accent)',
        lineHeight: 1,
        letterSpacing: '0.03em',
    },
    ringTotal: {
        fontSize: '0.65rem',
        color: 'var(--color-text-dim)',
        letterSpacing: '0.04em',
    },
    nivelInfo: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
    },
    nivelNum: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--color-text-dim)',
    },
    nivelNome: {
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1.5rem',
        color: 'var(--color-text)',
        letterSpacing: '0.06em',
        lineHeight: 1,
    },
    xpTotal: {
        fontSize: '0.72rem',
        color: 'var(--color-text-dim)',
        marginTop: 2,
    },
    section: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
    },
    sectionLabel: {
        fontSize: '0.72rem',
        fontWeight: 700,
        color: 'var(--color-text-dim)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    cardList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
    },
    card: {
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 16,
        padding: '14px 16px',
        boxShadow: 'var(--color-shadow)',
    },
    cardIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    cardInfo: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
    },
    cardRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    },
    cardNome: {
        fontSize: '0.9rem',
        fontWeight: 700,
        color: 'var(--color-text)',
        lineHeight: 1,
    },
    xpBadge: {
        fontSize: '0.68rem',
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: 99,
        letterSpacing: '0.04em',
        fontFamily: "'Barlow Condensed', sans-serif",
        flexShrink: 0,
    },
    cardDesc: {
        fontSize: '0.72rem',
        color: 'var(--color-text-dim)',
        lineHeight: 1.3,
    },
    barTrack: {
        height: 5,
        background: 'var(--color-surface-3)',
        borderRadius: 99,
        overflow: 'hidden',
        marginTop: 2,
    },
    barFill: {
        height: '100%',
        borderRadius: 99,
        minWidth: 4,
    },
    cardProg: {
        fontSize: '0.68rem',
        color: 'var(--color-text-dim)',
        letterSpacing: '0.02em',
    },
};
