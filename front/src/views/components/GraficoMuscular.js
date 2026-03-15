import React from 'react';

const API = process.env.REACT_APP_API_BASE_URL;

// Ordem posicional: top → sentido horário
const MUSCLES = [
    { key: 'Costas',      img: 'costas.png'      }, // 0 topo
    { key: 'Ombros',      img: 'ombros.png'       }, // 1 topo-dir
    { key: 'Bíceps',      img: 'biceps.png'       }, // 2 dir
    { key: 'Peitoral',    img: 'peito.png'        }, // 3 baixo-dir
    { key: 'Panturrilha', img: 'panturrilha.png'  }, // 4 baixo (palavra longa → centralizada)
    { key: 'Pernas',      img: 'perna.png'        }, // 5 baixo-esq
    { key: 'Abdômen',     img: 'abdomen.png'      }, // 6 esq
    { key: 'Tríceps',     img: 'triceps.png'      }, // 7 topo-esq
];

const N   = MUSCLES.length;
const CX  = 280, CY = 280;
const MAX_R  = 130;   // raio máximo da área de dados
const ICON_R = 175;   // raio onde ficam os ícones
const IS  = 38;       // tamanho do ícone (px viewBox)
const IR  = IS / 2;   // raio do ícone

// Escala absoluta baseada em evidências de hipertrofia:
// 80 séries/mês por grupo = teto do gráfico (zona alta)
// Anéis: 20 | 40 | 60 | 80 séries
const TARGET = 80;

const ang  = (i) => (2 * Math.PI * i / N) - Math.PI / 2;
const tip  = (r, i) => [CX + r * Math.cos(ang(i)), CY + r * Math.sin(ang(i))];

const poly = (vals) =>
    vals.map((v, i) => {
        const [x, y] = tip(v * MAX_R, i);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

const gridPoly = (f) =>
    Array.from({ length: N }, (_, i) => {
        const [x, y] = tip(f * MAX_R, i);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

export default function GraficoMuscular({ dados = {} }) {
    // Escala absoluta: cada músculo é medido contra TARGET, não contra os outros.
    // Valores acima de TARGET ficam levemente além do anel externo (permitido).
    const intensities = MUSCLES.map(m => Math.min((dados[m.key] || 0) / TARGET, 1.0));
    const iconPositions = MUSCLES.map((_, i) => tip(ICON_R, i));

    return (
        <svg
            viewBox="0 0 560 560"
            style={{ width: '100%', maxWidth: 440, display: 'block', margin: '0 auto' }}
        >
            <defs>
                <filter id="mglow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
                    <feMerge>
                        <feMergeNode in="b" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <filter id="halo" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
                </filter>

                <radialGradient id="rfill" cx="50%" cy="50%" r="50%">
                    <stop offset="0%"   stopColor="#4A90D9" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#6AAFF0" stopOpacity="0.05" />
                </radialGradient>

                {/* clipPath por ícone, no espaço do usuário */}
                {iconPositions.map(([ix, iy], i) => (
                    <clipPath key={i} id={`ic${i}`}>
                        <circle cx={ix} cy={iy} r={IR} />
                    </clipPath>
                ))}
            </defs>

            {/* ── GRID CONCÊNTRICO ── */}
            {[0.25, 0.5, 0.75, 1.0].map((f, gi) => {
                // label no eixo de Costas (i=0, topo) — ligeiramente à direita
                const [lx, ly] = tip(f * MAX_R, 0);
                const label = `${Math.round(f * TARGET)}`;
                return (
                    <g key={gi}>
                        <polygon
                            points={gridPoly(f)}
                            fill="none"
                            stroke={f === 1.0 ? '#383858' : '#222236'}
                            strokeWidth={f === 1.0 ? 1.0 : 0.6}
                            strokeDasharray={f < 1.0 ? '4 5' : undefined}
                        />
                        <text
                            x={lx + 5} y={ly}
                            textAnchor="start"
                            dominantBaseline="middle"
                            fill="#33334e"
                            fontSize="8.5"
                            fontFamily="system-ui, sans-serif"
                        >
                            {label}
                        </text>
                    </g>
                );
            })}

            {/* ── EIXOS ── */}
            {MUSCLES.map((_, i) => {
                const [x, y] = tip(MAX_R, i);
                return (
                    <line key={i} x1={CX} y1={CY} x2={x} y2={y}
                        stroke="#252538" strokeWidth="0.8" />
                );
            })}

            {/* ── ÁREA PREENCHIDA (glow difuso atrás) ── */}
            <polygon
                points={poly(intensities)}
                fill="#4A90D9"
                opacity="0.1"
                filter="url(#halo)"
            />

            {/* ── ÁREA PREENCHIDA ── */}
            <polygon
                points={poly(intensities)}
                fill="url(#rfill)"
                stroke="none"
            />

            {/* ── BORDA COM GLOW ── */}
            <polygon
                points={poly(intensities)}
                fill="none"
                stroke="#4A90D9"
                strokeWidth="2.2"
                strokeLinejoin="round"
                filter="url(#mglow)"
                opacity="0.95"
            />

            {/* ── PONTOS DE DADOS ── */}
            {intensities.map((v, i) => {
                if (v <= 0) return null;
                const [x, y] = tip(v * MAX_R, i);
                return (
                    <circle key={i} cx={x} cy={y} r={4}
                        fill="#4A90D9"
                        filter="url(#mglow)"
                    />
                );
            })}

            {/* ── PONTO CENTRAL ── */}
            <circle cx={CX} cy={CY} r={3} fill="#383858" />

            {/* ── ÍCONES E LABELS ── */}
            {MUSCLES.map((m, i) => {
                const [ix, iy] = iconPositions[i];
                const intensity = intensities[i];
                const count = dados[m.key] || 0;

                // direção para afastar o label do centro
                const dx = ix - CX, dy = iy - CY;
                const len = Math.sqrt(dx * dx + dy * dy);
                const nx = dx / len, ny = dy / len;
                const labelDist = IR + 18;
                const lx = ix + nx * labelDist;
                const ly = iy + ny * labelDist;
                const anchor = Math.abs(nx) < 0.25 ? 'middle' : nx > 0 ? 'start' : 'end';

                return (
                    <g key={i}>
                        {/* halo pulsante quando trabalhado */}
                        {intensity > 0.3 && (
                            <circle cx={ix} cy={iy} r={IR + 10}
                                fill="none"
                                stroke="#4A90D9"
                                strokeWidth="1.5"
                                opacity={0.15 + intensity * 0.35}
                                filter="url(#mglow)"
                            />
                        )}

                        {/* fundo do ícone */}
                        <circle cx={ix} cy={iy} r={IR + 4}
                            fill="#0f0f1e"
                            stroke={intensity > 0 ? '#4A90D9' : '#2a2a40'}
                            strokeWidth={intensity > 0 ? 1.8 : 0.8}
                            opacity={intensity > 0 ? 1 : 0.5}
                            filter={intensity > 0.5 ? 'url(#mglow)' : undefined}
                        />

                        {/* imagem PNG */}
                        <image
                            href={`${API}/uploads/${m.img}`}
                            x={ix - IR} y={iy - IR}
                            width={IS} height={IS}
                            clipPath={`url(#ic${i})`}
                            opacity={intensity > 0 ? 1 : 0.25}
                        />

                        {/* nome do músculo */}
                        <text
                            x={lx} y={ly}
                            textAnchor={anchor}
                            dominantBaseline="middle"
                            fill={intensity > 0 ? '#d0cfee' : '#3a3a58'}
                            fontSize="10"
                            fontFamily="system-ui, sans-serif"
                            fontWeight={intensity > 0.5 ? '600' : '400'}
                        >
                            {m.key}
                        </text>

                        {/* contagem de séries */}
                        {count > 0 && (
                            <text
                                x={lx} y={ly + 13}
                                textAnchor={anchor}
                                dominantBaseline="middle"
                                fill="#4A90D9"
                                fontSize="9"
                                fontFamily="system-ui, sans-serif"
                            >
                                {count} séries
                            </text>
                        )}
                    </g>
                );
            })}
        </svg>
    );
}
