import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../AuthContext';
import PageStateHandler from '../components/PageStateHandler';
import BadgeNivel, { COR_NIVEL } from '../components/BadgeNivel';
import { NOMES_NIVEL, XP_NIVEL } from '../components/EstrelasNivel';
import '../../styles/Progresso.css';

const API = process.env.REACT_APP_API_BASE_URL;

// ── Ícones dos objetivos ──────────────────────────────────────────────────────
function IconeObjetivo({ tipo, cor }) {
    const s = { width: 20, height: 20 };
    if (tipo === 'dumbbell') return (
        <svg {...s} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4v16M18 4v16M8 8h8M8 16h8M4 6h4M4 18h4M16 6h4M16 18h4" />
        </svg>
    );
    if (tipo === 'water') return (
        <svg {...s} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6 9 4 13.5 4 16a8 8 0 0 0 16 0c0-2.5-2-7-8-14z" />
        </svg>
    );
    if (tipo === 'cardio' || tipo === 'fire') return (
        <svg {...s} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    );
    if (tipo === 'calendar') return (
        <svg {...s} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
    if (tipo === 'muscle') return (
        <svg {...s} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4v16M18 4v16M8 8h8M8 16h8" />
        </svg>
    );
    return null;
}

// ── Card de objetivo ──────────────────────────────────────────────────────────
function CardObjetivo({ obj, index }) {
    const pct = Math.min(obj.progresso / obj.total, 1);
    const cor = obj.completo ? 'var(--color-green)' : 'var(--color-accent)';

    return (
        <div
            className={`pg-obj${obj.completo ? ' pg-obj-done' : ''}`}
            style={{ animation: 'fadeIn 0.3s ease both', animationDelay: `${index * 0.06}s` }}
        >
            <div className="pg-obj-icon" style={{ background: obj.completo ? 'rgba(46,204,113,0.12)' : 'var(--color-accent-dim)' }}>
                <IconeObjetivo tipo={obj.icone} cor={cor} />
            </div>
            <div className="pg-obj-info">
                <div className="pg-obj-row">
                    <span className="pg-obj-nome">{obj.nome}</span>
                    <span className="pg-obj-xp" style={{ background: obj.completo ? 'rgba(46,204,113,0.14)' : 'var(--color-accent-dim)', color: obj.completo ? 'var(--color-green)' : 'var(--color-accent)' }}>
                        {obj.completo ? '✓ ' : '+'}{obj.xp} XP
                    </span>
                </div>
                <div className="pg-obj-desc">{obj.descricao}</div>
                <div className="pg-bar-track">
                    <div className="pg-bar-fill" style={{ width: `${pct * 100}%`, background: cor, boxShadow: obj.completo ? '0 0 8px rgba(46,204,113,0.4)' : 'none' }} />
                </div>
                <span className="pg-obj-prog">{obj.completo ? 'Completo' : `${obj.progresso} / ${obj.total}`}</span>
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
            <div className="pg-page">
                <div className="pg-skel-hero" />
                <div className="pg-skel-row" />
                {[1, 2, 3].map(i => <div key={i} className="pg-skel-card" />)}
            </div>
        </PageStateHandler>
    );

    const nivel = dados.nivel;
    const cor = COR_NIVEL[nivel] || '#4A90D9';
    const isMax = nivel >= 7;
    const proximoNome = isMax ? null : NOMES_NIVEL[nivel]; // próximo = índice nivel
    const faltam = isMax ? 0 : Math.max(dados.xp_para_proximo - dados.xp_no_nivel, 0);
    const pct = isMax ? 1 : dados.pct_nivel;

    const diarios = dados.objetivos.filter(o => o.tipo === 'diario');
    const semanais = dados.objetivos.filter(o => o.tipo === 'semanal');

    return (
        <PageStateHandler>
            <div className="pg-page">

                {/* ── HEADER ── */}
                <div className="pg-header">
                    <span className="pg-title">Progresso</span>
                    {dados.streak_atual > 0 && (
                        <span className="pg-streak">🔥 {dados.streak_atual} dias</span>
                    )}
                </div>

                {/* ── HERO: rank atual ── */}
                <div className="pg-hero" style={{ '--rank-cor': cor }}>
                    <div className="pg-hero-glow" style={{ background: `radial-gradient(circle, ${cor}33 0%, transparent 70%)` }} />

                    <BadgeNivel nivel={nivel} variant="full" expansivel />

                    {/* Barra de XP até o próximo rank */}
                    <div className="pg-xp-area">
                        <div className="pg-xp-labels">
                            <span style={{ color: cor }}>Nível {nivel}</span>
                            <span>{isMax ? 'RANK MÁXIMO' : `Próximo: ${proximoNome}`}</span>
                        </div>
                        <div className="pg-xp-track">
                            <div className="pg-xp-fill" style={{ width: `${pct * 100}%`, background: `linear-gradient(90deg, ${cor}, ${cor}cc)`, boxShadow: `0 0 10px ${cor}88` }} />
                        </div>
                        <div className="pg-xp-sub">
                            {isMax
                                ? `${dados.xp_total} XP — você chegou ao topo do Olimpo! 🏛️`
                                : `Faltam ${faltam} XP para ${proximoNome}`}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="pg-stats">
                        <div className="pg-stat"><span className="pg-stat-val">{dados.xp_total}</span><span className="pg-stat-lbl">XP total</span></div>
                        <div className="pg-stat"><span className="pg-stat-val">{dados.streak_atual}</span><span className="pg-stat-lbl">Sequência</span></div>
                        <div className="pg-stat"><span className="pg-stat-val">{dados.maior_streak}</span><span className="pg-stat-lbl">Recorde</span></div>
                    </div>
                </div>

                {/* ── JORNADA DOS RANKS ── */}
                <div className="pg-section">
                    <span className="pg-section-label">Jornada dos Ranks</span>
                    <div className="pg-trilha">
                        <div className="pg-trilha-line" />
                        {NOMES_NIVEL.map((nome, i) => {
                            const lvl = i + 1;
                            const xpMin = XP_NIVEL[i];
                            const conquistado = dados.xp_total >= xpMin;
                            const atual = lvl === nivel;
                            const corLvl = COR_NIVEL[lvl];
                            return (
                                <div key={lvl} className={`pg-rank${atual ? ' pg-rank-atual' : ''}`}>
                                    <div
                                        className="pg-rank-medal"
                                        style={{
                                            filter: conquistado ? 'none' : 'grayscale(1)',
                                            opacity: conquistado ? 1 : 0.4,
                                            boxShadow: atual ? `0 0 0 2px ${corLvl}, 0 0 16px ${corLvl}88` : 'none',
                                        }}
                                    >
                                        <BadgeNivel nivel={lvl} variant="medal" tamanho={atual ? 64 : 50} />
                                        {!conquistado && (
                                            <span className="pg-rank-lock">
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                </svg>
                                            </span>
                                        )}
                                    </div>
                                    <span className="pg-rank-nome" style={{ color: atual ? corLvl : 'var(--color-text-dim)' }}>{nome}</span>
                                    <span className="pg-rank-xp">{xpMin === 0 ? 'Início' : `${xpMin}`}</span>
                                    {atual && <span className="pg-rank-voce" style={{ background: corLvl }}>VOCÊ</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── OBJETIVOS DIÁRIOS ── */}
                {diarios.length > 0 && (
                    <div className="pg-section">
                        <span className="pg-section-label">Objetivos Diários</span>
                        <div className="pg-obj-list">
                            {diarios.map((obj, i) => <CardObjetivo key={obj.id} obj={obj} index={i} />)}
                        </div>
                    </div>
                )}

                {/* ── OBJETIVOS SEMANAIS ── */}
                {semanais.length > 0 && (
                    <div className="pg-section">
                        <span className="pg-section-label">Objetivos Semanais</span>
                        <div className="pg-obj-list">
                            {semanais.map((obj, i) => <CardObjetivo key={obj.id} obj={obj} index={i} />)}
                        </div>
                    </div>
                )}

            </div>
        </PageStateHandler>
    );
}
