import React from 'react';
import { infoNivel, SUBS } from './rankInfo';

// Re-export para compatibilidade — a fonte da verdade é rankInfo.js
export { NOMES_NIVEL, XP_NIVEL, NOMES_TIER } from './rankInfo';

// Estrelas do sub-rank: `total` estrelas, as primeiras `preenchidas` cheias.
// Passando `nivel` (1..21) ele deriva o sub-rank (I → 1 estrela, III → 3).
export default function EstrelasNivel({
    nivel,
    preenchidas,
    total = SUBS,
    size = 12,
    gap = 2,
    cor = '#4A90D9',
    corVazia = 'rgba(74,144,217,0.35)',
}) {
    const info  = infoNivel(nivel);
    const cheia = Math.max(0, Math.min(total, preenchidas != null ? preenchidas : info.sub));
    return (
        <span
            title={`${info.nome} · nível ${info.nivel}`}
            aria-label={`${info.nome}, nível ${info.nivel}`}
            style={{ display: 'inline-flex', gap, alignItems: 'center', lineHeight: 0 }}
        >
            {Array.from({ length: total }).map((_, i) => {
                const preenchida = i < cheia;
                return (
                    <svg
                        key={i}
                        width={size}
                        height={size}
                        viewBox="0 0 24 24"
                        fill={preenchida ? cor : 'none'}
                        stroke={preenchida ? cor : corVazia}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                );
            })}
        </span>
    );
}
