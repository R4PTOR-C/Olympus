import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../AuthContext';
import PageStateHandler from '../components/PageStateHandler';
import BadgeNivel from '../components/BadgeNivel';
import RankModal from '../components/RankModal';
import { infoNivel, NIVEIS, TIERS } from '../components/rankInfo';
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
    const [rankAberto, setRankAberto] = useState(null); // nível exibido no modal
    const trilhaRef = useRef(null);

    useEffect(() => {
        if (!userId) return;
        fetch(`${API}/gamificacao/usuarios/${userId}/progresso`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(setDados)
            .catch(() => {});
    }, [userId, token]);

    // Centraliza o tier atual na trilha assim que os dados chegam
    useEffect(() => {
        if (!dados || !trilhaRef.current) return;
        const alvo = trilhaRef.current.querySelector('[data-tier-atual="sim"]');
        if (!alvo) return;
        trilhaRef.current.scrollTo({
            left: alvo.offsetLeft - (trilhaRef.current.clientWidth - alvo.offsetWidth) / 2,
            behavior: 'smooth',
        });
    }, [dados]);

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
    const info = infoNivel(nivel);
    const cor = info.cor;
    const corAcento = info.corAcento;
    const isMax = info.isMax;
    const proximoNome = info.proximo ? info.proximo.nome : null;
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

                    <button
                        type="button"
                        className="pg-hero-badge"
                        onClick={() => setRankAberto(nivel)}
                        aria-label={`Ver detalhes do rank ${info.nome}`}
                    >
                        <BadgeNivel nivel={nivel} variant="full" />
                    </button>

                    {/* Barra de XP até o próximo rank */}
                    <div className="pg-xp-area">
                        <div className="pg-xp-labels">
                            <span style={{ color: cor }}>Nível {nivel} · {info.nome}</span>
                            <span>{isMax ? 'RANK MÁXIMO' : `Próximo: ${proximoNome}`}</span>
                        </div>
                        <div className="pg-xp-track">
                            <div className="pg-xp-fill" style={{ width: `${pct * 100}%`, background: `linear-gradient(90deg, ${cor}, ${corAcento})`, boxShadow: `0 0 10px ${cor}88` }} />
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
                    <div className="pg-trilha" ref={trilhaRef}>
                        {TIERS.map(t => {
                            const ranks = NIVEIS.filter(r => r.tier === t.tier);
                            const tierAtual = t.tier === info.tier;
                            const tierAberto = dados.xp_total >= t.xpMin;
                            return (
                                <div
                                    key={t.tier}
                                    className={`pg-tier${tierAtual ? ' pg-tier-atual' : ''}`}
                                    data-tier-atual={tierAtual ? 'sim' : undefined}
                                    style={{ borderColor: tierAtual ? `${t.cor}66` : undefined }}
                                >
                                    <span className="pg-tier-nome" style={{ color: tierAberto ? t.cor : 'var(--color-text-dim)' }}>
                                        {t.nome}
                                    </span>
                                    <div className="pg-tier-ranks">
                                        <div className="pg-trilha-line" />
                                        {ranks.map(r => {
                                            const conquistado = dados.xp_total >= r.xpMin;
                                            const atual = r.nivel === nivel;
                                            return (
                                                <button
                                                    key={r.nivel}
                                                    type="button"
                                                    className={`pg-rank pg-rank-btn${atual ? ' pg-rank-atual' : ''}`}
                                                    onClick={() => setRankAberto(r.nivel)}
                                                    aria-label={`Ver detalhes do rank ${r.nome}`}
                                                >
                                                    <div
                                                        className="pg-rank-medal"
                                                        style={{
                                                            filter: conquistado ? 'none' : 'grayscale(1)',
                                                            opacity: conquistado ? 1 : 0.4,
                                                            boxShadow: atual ? `0 0 0 2px ${r.cor}, 0 0 16px ${r.cor}88` : 'none',
                                                        }}
                                                    >
                                                        <BadgeNivel nivel={r.nivel} variant="medal" tamanho={atual ? 58 : 46} />
                                                        {!conquistado && (
                                                            <span className="pg-rank-lock">
                                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                                </svg>
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="pg-rank-nome" style={{ color: atual ? r.cor : 'var(--color-text-dim)' }}>{r.romano}</span>
                                                    <span className="pg-rank-xp">{r.xpMin === 0 ? 'Início' : r.xpMin}</span>
                                                    {atual && <span className="pg-rank-voce" style={{ background: r.cor }}>VOCÊ</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
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

                {/* ── MODAL DE RANK ── */}
                {rankAberto && (
                    <RankModal
                        nivel={rankAberto}
                        xpTotal={dados.xp_total}
                        onClose={() => setRankAberto(null)}
                    />
                )}

            </div>
        </PageStateHandler>
    );
}
