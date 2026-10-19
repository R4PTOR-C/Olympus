import React, { useEffect, useState } from 'react';
import EstrelasNivel from './EstrelasNivel';
import { infoNivel, arteFallback, TOTAL_NIVEIS } from './rankInfo';
import '../../styles/Progresso.css';

const hexToRgba = (hex, a) => {
    const m = hex.replace('#', '');
    return `rgba(${parseInt(m.slice(0, 2), 16)}, ${parseInt(m.slice(2, 4), 16)}, ${parseInt(m.slice(4, 6), 16)}, ${a})`;
};

// Modal com a arte do rank em destaque + informações (status, faixa de XP, progresso).
// `onNavegar(nivel)` (opcional) habilita as setas para percorrer os ranks.
export default function RankModal({ nivel, xpTotal = 0, onClose, onNavegar }) {
    const info = infoNivel(nivel);
    const { nivel: n, nome, nomeTier, romano, cor, corAcento, arte, tier, sub, xpMin, xpProx, isMax, lore } = info;

    const [erroImg, setErroImg] = useState(false);
    const [usouFallback, setUsouFallback] = useState(false);

    // Novo rank exibido → volta a tentar a arte própria dele
    useEffect(() => { setErroImg(false); setUsouFallback(false); }, [n]);

    const anterior = n > 1 ? n - 1 : null;
    const proximo  = n < TOTAL_NIVEIS ? n + 1 : null;

    useEffect(() => {
        const onKey = e => {
            if (e.key === 'Escape') onClose();
            else if (onNavegar && e.key === 'ArrowLeft' && anterior) onNavegar(anterior);
            else if (onNavegar && e.key === 'ArrowRight' && proximo) onNavegar(proximo);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose, onNavegar, anterior, proximo]);

    // Arte do sub-rank ausente → arte do sub-rank 1 do tier → número
    const onErroImg = (e) => {
        if (!usouFallback && sub !== 1) {
            setUsouFallback(true);
            e.target.src = arteFallback(tier);
        } else {
            setErroImg(true);
        }
    };

    const conquistado = xpTotal >= xpMin;
    const atual       = conquistado && (isMax || xpTotal < xpProx);
    const faltam      = Math.max(xpMin - xpTotal, 0);

    // Barra: progresso dentro do rank (se atual) ou rumo a ele (se bloqueado)
    let pct, legenda;
    if (atual && isMax) {
        pct = 1;
        legenda = `${xpTotal} XP. Topo do Olimpo alcançado.`;
    } else if (atual) {
        pct = Math.min((xpTotal - xpMin) / (xpProx - xpMin), 1);
        legenda = `${xpTotal - xpMin} / ${xpProx - xpMin} XP dentro deste rank`;
    } else if (conquistado) {
        pct = 1;
        legenda = 'Rank já conquistado';
    } else {
        pct = xpMin > 0 ? Math.min(xpTotal / xpMin, 1) : 1;
        legenda = `Faltam ${faltam} XP para desbloquear`;
    }

    const status = atual ? 'SEU RANK ATUAL' : conquistado ? 'CONQUISTADO' : 'BLOQUEADO';

    return (
        <div className="rk-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Rank ${nome}`}>
            <div
                className="rk-card"
                onClick={e => e.stopPropagation()}
                style={{
                    '--rk-cor': cor,
                    borderColor: hexToRgba(cor, 0.45),
                    boxShadow: `0 24px 60px rgba(0,0,0,0.6), 0 0 80px ${hexToRgba(cor, 0.12)}`,
                }}
            >
                <span className="rk-grabber" aria-hidden="true" />

                <button className="rk-close" onClick={onClose} aria-label="Fechar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                {/* Arte */}
                <div className="rk-arte" style={{ background: `radial-gradient(circle at 50% 48%, ${hexToRgba(cor, conquistado ? 0.28 : 0.1)} 0%, transparent 66%)` }}>
                    {erroImg ? (
                        <span className="rk-arte-fallback" style={{ color: cor }}>{n}</span>
                    ) : (
                        <img
                            key={n}
                            src={arte}
                            alt={`Arte do rank ${nome}`}
                            onError={onErroImg}
                            style={{ filter: conquistado ? 'none' : 'grayscale(1) brightness(0.7)', opacity: conquistado ? 1 : 0.55 }}
                        />
                    )}
                    {!conquistado && (
                        <span className="rk-arte-lock" aria-hidden="true">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </span>
                    )}
                </div>

                <div className="rk-corpo">
                    {/* Identidade */}
                    <span
                        className="rk-status"
                        style={{
                            color: conquistado ? cor : 'rgba(255,255,255,0.55)',
                            background: conquistado ? hexToRgba(cor, 0.14) : 'rgba(255,255,255,0.06)',
                            borderColor: conquistado ? hexToRgba(cor, 0.35) : 'rgba(255,255,255,0.1)',
                        }}
                    >
                        {status}
                    </span>
                    <h2 className="rk-nome" style={{ color: cor, textShadow: `0 0 18px ${hexToRgba(corAcento, 0.4)}` }}>
                        {nomeTier} <span className="rk-romano" style={{ color: corAcento }}>{romano}</span>
                    </h2>
                    <EstrelasNivel nivel={n} size={18} gap={5} cor={corAcento} corVazia={hexToRgba(corAcento, 0.3)} />

                    <p className="rk-lore">{lore}</p>

                    {/* Progresso */}
                    <div className="rk-prog">
                        <div className="rk-prog-track">
                            <div
                                className="rk-prog-fill"
                                style={{
                                    width: `${pct * 100}%`,
                                    background: `linear-gradient(90deg, ${cor}, ${corAcento})`,
                                    boxShadow: `0 0 10px ${hexToRgba(cor, 0.55)}`,
                                }}
                            />
                        </div>
                        <span className="rk-prog-lbl">{legenda}</span>
                    </div>

                    {/* Números */}
                    <dl className="rk-infos">
                        <div className="rk-info">
                            <dt className="rk-info-lbl">Para entrar</dt>
                            <dd className="rk-info-val">{xpMin} XP</dd>
                        </div>
                        <div className="rk-info">
                            <dt className="rk-info-lbl">Faixa</dt>
                            <dd className="rk-info-val">{isMax ? `${xpMin}+` : `${xpMin}–${xpProx - 1}`}</dd>
                        </div>
                        <div className="rk-info">
                            <dt className="rk-info-lbl">Nível</dt>
                            <dd className="rk-info-val">{n}/{TOTAL_NIVEIS}</dd>
                        </div>
                    </dl>

                    {onNavegar ? (
                        <div className="rk-nav">
                            <button type="button" className="rk-nav-btn" onClick={() => onNavegar(anterior)} disabled={!anterior} aria-label="Rank anterior">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                            </button>
                            <span className="rk-tier-lbl">Tier {tier} de 8 · sub-rank {sub} de 3</span>
                            <button type="button" className="rk-nav-btn" onClick={() => onNavegar(proximo)} disabled={!proximo} aria-label="Próximo rank">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                            </button>
                        </div>
                    ) : (
                        <span className="rk-tier-lbl">Tier {tier} de 8 · sub-rank {sub} de 3</span>
                    )}
                </div>
            </div>
        </div>
    );
}
