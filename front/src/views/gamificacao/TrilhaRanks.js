import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import BadgeNivel from '../components/BadgeNivel';
import { NIVEIS, TIERS, TOTAL_NIVEIS } from '../components/rankInfo';

const IconeCadeado = ({ size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

// Trilha vertical estilo "trophy road": sobe do Mortal I (embaixo) ao Olimpiano III (topo).
// A linha fica preenchida até a posição exata do usuário — entre o rank atual e o
// próximo, proporcional a `pctNivel` — medida no DOM para não depender de alturas fixas.
export default function TrilhaRanks({ nivel, xpTotal, pctNivel, faltam, onAbrir }) {
    const scrollRef = useRef(null);
    const trilhaRef = useRef(null);
    const [linha, setLinha] = useState(null); // { top, altura, preenchido } em px

    useLayoutEffect(() => {
        const trilha = trilhaRef.current;
        if (!trilha) return;
        const medir = () => {
            const base = trilha.getBoundingClientRect().top;
            const centro = n => {
                const r = trilha.querySelector(`[data-nivel="${n}"]`).getBoundingClientRect();
                return r.top - base + r.height / 2;
            };
            const yTopo = centro(TOTAL_NIVEIS);
            const yBase = centro(1);
            const yAtual = centro(nivel);
            const yFim = nivel < TOTAL_NIVEIS ? yAtual - (yAtual - centro(nivel + 1)) * pctNivel : yTopo;
            setLinha({ top: yTopo, altura: yBase - yTopo, preenchido: yBase - yFim });
        };
        medir();
        const ro = new ResizeObserver(medir);
        ro.observe(trilha);
        return () => ro.disconnect();
    }, [nivel, pctNivel]);

    // Abre a trilha já centralizada no rank atual
    useEffect(() => {
        const sc = scrollRef.current;
        const alvo = sc && sc.querySelector(`[data-nivel="${nivel}"]`);
        if (!alvo) return;
        const r = alvo.getBoundingClientRect();
        const s = sc.getBoundingClientRect();
        sc.scrollTop += r.top - s.top - (sc.clientHeight - r.height) / 2;
    }, [nivel]);

    const { tier: tierAtual, cor: corAtual } = NIVEIS[nivel - 1];

    return (
        <div className="pg-trilha-scroll" ref={scrollRef} style={{ '--rank-cor': corAtual }}>
            <div className="pg-trilha" ref={trilhaRef}>
                {linha && (
                    <>
                        <span className="pg-trilha-track" style={{ top: linha.top, height: linha.altura }} />
                        <span className="pg-trilha-fill" style={{ top: linha.top + linha.altura - linha.preenchido, height: linha.preenchido }} />
                    </>
                )}

                <div className="pg-trilha-topo">
                    <span className="pg-trilha-topo-lbl">Topo do Olimpo</span>
                </div>

                {[...TIERS].reverse().map(t => {
                    const ranks = NIVEIS.filter(r => r.tier === t.tier).reverse();
                    const aberto = xpTotal >= t.xpMin;
                    const atual = t.tier === tierAtual;
                    const estado = atual ? 'atual' : aberto ? 'completo' : 'bloqueado';
                    return (
                        <section key={t.tier} className={`pg-trilha-tier is-${estado}`} style={{ '--tier-cor': t.cor }}>
                            {ranks.map(r => {
                                const conquistado = xpTotal >= r.xpMin;
                                const ehAtual = r.nivel === nivel;
                                return (
                                    <div
                                        key={r.nivel}
                                        className={`pg-trilha-row ${r.nivel % 2 ? 'lado-dir' : 'lado-esq'}${ehAtual ? ' is-atual' : ''}${conquistado ? '' : ' is-bloqueado'}`}
                                    >
                                        <div className="pg-trilha-marca">
                                            {ehAtual && <span className="pg-trilha-voce">Você</span>}
                                        </div>
                                        <button
                                            type="button"
                                            className="pg-trilha-node"
                                            data-nivel={r.nivel}
                                            onClick={() => onAbrir(r.nivel)}
                                            aria-label={`Ver detalhes do rank ${r.nome}${ehAtual ? ' (seu rank atual)' : conquistado ? '' : ' (bloqueado)'}`}
                                        >
                                            <BadgeNivel nivel={r.nivel} variant="medal" tamanho={ehAtual ? 96 : 66} />
                                            {!conquistado && <span className="pg-trilha-lock"><IconeCadeado /></span>}
                                        </button>
                                        <div className="pg-trilha-info">
                                            <span className="pg-trilha-nome">{r.nomeTier} {r.romano}</span>
                                            {ehAtual ? (
                                                nivel < TOTAL_NIVEIS ? (
                                                    <>
                                                        <span className="pg-trilha-mini" aria-hidden="true">
                                                            <span style={{ width: `${pctNivel * 100}%` }} />
                                                        </span>
                                                        <span className="pg-trilha-xp">Faltam {faltam} XP</span>
                                                    </>
                                                ) : (
                                                    <span className="pg-trilha-xp">Rank máximo</span>
                                                )
                                            ) : (
                                                <span className="pg-trilha-xp">{r.xpMin === 0 ? 'Início' : `${r.xpMin} XP`}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Portal de entrada do tier (fica abaixo dos sub-ranks: você passa por ele ao subir) */}
                            <div className="pg-trilha-banner">
                                <span className="pg-trilha-banner-num">{t.tier}</span>
                                <span className="pg-trilha-banner-txt">
                                    <span className="pg-trilha-banner-nome">{t.nome}</span>
                                    <span className="pg-trilha-banner-xp">{t.xpMin === 0 ? 'Início da jornada' : `A partir de ${t.xpMin} XP`}</span>
                                </span>
                                <span className="pg-trilha-banner-estado">
                                    {estado === 'bloqueado' ? <IconeCadeado size={15} /> : estado === 'atual' ? 'Atual' : 'Concluído'}
                                </span>
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}
