import React from 'react';

// Nomes dos níveis — devem espelhar NIVEIS em back/gamificacao_engine.js
export const NOMES_NIVEL = ['Mortal', 'Guerreiro', 'Herói', 'Campeão', 'Semideus', 'Titã', 'Olimpiano'];
const NOMES = NOMES_NIVEL;

// Badge de nível: 7 estrelas, as primeiras `nivel` preenchidas.
export default function EstrelasNivel({ nivel = 1, size = 12, gap = 2, cor = '#4A90D9', corVazia = 'rgba(74,144,217,0.35)' }) {
    const n = Math.max(1, Math.min(7, parseInt(nivel) || 1));
    const nome = NOMES[n - 1];
    return (
        <span
            title={`Nível ${n} · ${nome}`}
            aria-label={`Nível ${n}: ${nome}`}
            style={{ display: 'inline-flex', gap, alignItems: 'center', lineHeight: 0 }}
        >
            {Array.from({ length: 7 }).map((_, i) => {
                const cheia = i < n;
                return (
                    <svg
                        key={i}
                        width={size}
                        height={size}
                        viewBox="0 0 24 24"
                        fill={cheia ? cor : 'none'}
                        stroke={cheia ? cor : corVazia}
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
