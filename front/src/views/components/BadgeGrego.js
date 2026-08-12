import React, { useId } from 'react';

/*
 * Badge grego montado em SVG (aro + grega + losangos vetoriais) com a figura
 * central vinda de /badge-figura-1.png (recorte do badge original, branco + alpha,
 * usado como máscara para poder ser tingido em qualquer cor).
 *
 * Toda a geometria foi medida no badge-nivel-1-1.png original (1254px) e convertida
 * para o viewBox de 1000px  ->  fator 500/627.
 */

const VB = 1000;           // viewBox
const C = VB / 2;          // centro

const R_ARO_INT = 351;     // circunferência fina interna (centro do traço)
const W_ARO_INT = 8;
const R_ARO_EXT = 446;     // circunferência fina externa
const W_ARO_EXT = 13.5;

const R_GREGA_INT = 364.5; // borda interna da faixa da grega
const R_GREGA_EXT = 429;   // borda externa
const N_UNIDADES = 30;     // repetições da grega em volta do círculo
const TRACO = (R_GREGA_EXT - R_GREGA_INT) / 7; // largura do traço = espaço entre traços

const R_GEMA = 399.5;      // centro do losango (no meio do aro)
const H_GEMA = 83.5;       // meia-altura
const W_GEMA = 49.5;       // meia-largura
const CORTE_GEMA = 6.5;    // graus de grega apagados de cada lado do losango

// Posições (em graus, 0 = direita, sentido anti-horário) por quantidade de gemas.
export const ARRANJOS = {
    0: [],
    1: [90],              // só no topo
    2: [90, 270],         // topo + base
    '2-lados': [180, 0],  // esquerda + direita
    3: [90, 180, 0],      // topo + laterais (badge original)
    4: [90, 180, 270, 0],
};

const rad = (g) => (g * Math.PI) / 180;
const ponto = (r, ang) => [C + r * Math.cos(rad(ang)), C - r * Math.sin(rad(ang))];
const fmt = (n) => Math.round(n * 100) / 100;

/*
 * Uma unidade da grega em coordenadas polares.
 * Grade local 8x6: x 0..8 vira ângulo, y 1..7 vira raio (1 = borda externa).
 * O trilho contínuo fica na borda externa, como no badge original.
 * Traçado: M8,1 H0 V7 H6 V3 H2 V5 H4
 */
function unidadeGrega(angIni, passo) {
    const ang = (x) => angIni + (x / 8) * passo;
    const r = (y) => R_GREGA_EXT - TRACO / 2 - (y - 1) * TRACO;

    const L = (x, y) => { const [px, py] = ponto(r(y), ang(x)); return `L${fmt(px)},${fmt(py)}`; };
    // sweep 0 = ângulo crescente (anti-horário na tela); 1 = decrescente
    const A = (x, y, cresce) => {
        const [px, py] = ponto(r(y), ang(x));
        return `A${fmt(r(y))},${fmt(r(y))} 0 0 ${cresce ? 0 : 1} ${fmt(px)},${fmt(py)}`;
    };
    const [x0, y0] = ponto(r(1), ang(8));

    return [
        `M${fmt(x0)},${fmt(y0)}`,
        A(0, 1, false), // trilho externo, voltando
        L(0, 7),        // desce até a borda interna
        A(6, 7, true),  // base da espiral
        L(6, 3),        // sobe
        A(2, 3, false), // volta
        L(2, 5),        // desce
        A(4, 5, true),  // ponta da espiral
    ].join(' ');
}

function Grega({ cor, gemas, mascara }) {
    const passo = 360 / N_UNIDADES;
    const partes = [];
    for (let i = 0; i < N_UNIDADES; i++) partes.push(unidadeGrega(i * passo, passo));

    return (
        <>
            <defs>
                <mask id={mascara}>
                    <rect x="0" y="0" width={VB} height={VB} fill="#fff" />
                    {gemas.map((a) => {
                        const [x1, y1] = ponto(700, a - CORTE_GEMA);
                        const [x2, y2] = ponto(700, a + CORTE_GEMA);
                        return (
                            <path
                                key={a}
                                d={`M${C},${C} L${fmt(x1)},${fmt(y1)} L${fmt(x2)},${fmt(y2)} Z`}
                                fill="#000"
                            />
                        );
                    })}
                </mask>
            </defs>
            <path
                d={partes.join(' ')}
                fill="none"
                stroke={cor}
                strokeWidth={TRACO}
                strokeLinejoin="miter"
                strokeLinecap="butt"
                mask={`url(#${mascara})`}
            />
        </>
    );
}

// Losango facetado: metade esquerda iluminada em ouro, metade direita na sombra.
// Fica sempre na vertical, como no badge original (não acompanha o giro do aro).
function Gema({ ang, id }) {
    const [x, y] = ponto(R_GEMA, ang);
    const h = H_GEMA;
    const w = W_GEMA;
    return (
        <g transform={`translate(${fmt(x)},${fmt(y)})`}>
            <polygon points={`0,${-h} ${-w},0 0,0`} fill={`url(#${id}-ga)`} />
            <polygon points={`0,${h} ${-w},0 0,0`} fill={`url(#${id}-gb)`} />
            <polygon points={`0,${-h} ${w},0 0,0`} fill="#221206" />
            <polygon points={`0,${h} ${w},0 0,0`} fill="#150C03" />
            <path
                d={`M0,${-h} L${w},0 L0,${h} L${-w},0 Z M0,${-h} L0,${h} M${-w},0 L${w},0`}
                fill="none"
                stroke={`url(#${id}-gc)`}
                strokeWidth="3"
                strokeLinejoin="miter"
            />
        </g>
    );
}

/**
 * @param {number|string} gemas  quantidade de losangos (0..4) ou '2-lados'
 * @param {string} cor           cor do aro e da figura
 * @param {number} tamanho       lado em px
 * @param {string} figura        imagem (branco + alpha) usada como máscara da figura
 * @param {string} fundo         cor de fundo do medalhão
 */
export default function BadgeGrego({
    gemas = 1,
    cor = '#D87838',
    tamanho = 260,
    figura = '/badge-figura-1.png',
    fundo = 'transparent',
    className,
    style,
}) {
    const uid = `bg${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
    const angulos = ARRANJOS[gemas] || ARRANJOS[1];

    return (
        <svg
            viewBox={`0 0 ${VB} ${VB}`}
            width={tamanho}
            height={tamanho}
            className={className}
            style={style}
            role="img"
            aria-label={`Badge grego com ${angulos.length} losango(s)`}
        >
            <defs>
                <mask id={`${uid}-fig`}>
                    <image href={figura} x="0" y="0" width={VB} height={VB} preserveAspectRatio="xMidYMid meet" />
                </mask>
                <linearGradient id={`${uid}-ga`} x1="1" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#F8D69A" />
                    <stop offset="1" stopColor="#CE8635" />
                </linearGradient>
                <linearGradient id={`${uid}-gb`} x1="1" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#E5A94F" />
                    <stop offset="1" stopColor="#A96821" />
                </linearGradient>
                <linearGradient id={`${uid}-gc`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#F0BC6B" />
                    <stop offset="1" stopColor="#BE7A2C" />
                </linearGradient>
            </defs>

            {fundo !== 'transparent' && <circle cx={C} cy={C} r={R_ARO_EXT} fill={fundo} />}

            {/* aro: duas circunferências finas + grega no meio */}
            <circle cx={C} cy={C} r={R_ARO_EXT} fill="none" stroke={cor} strokeWidth={W_ARO_EXT} />
            <circle cx={C} cy={C} r={R_ARO_INT} fill="none" stroke={cor} strokeWidth={W_ARO_INT} />
            <Grega cor={cor} gemas={angulos} mascara={`${uid}-corte`} />

            {/* figura central (máscara branco+alpha tingida com `cor`) */}
            <rect x="0" y="0" width={VB} height={VB} fill={cor} mask={`url(#${uid}-fig)`} />

            {/* losangos por cima do aro */}
            {angulos.map((a) => <Gema key={a} ang={a} id={uid} />)}
        </svg>
    );
}
