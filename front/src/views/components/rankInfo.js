// ── Ranks ─────────────────────────────────────────────────────────────────────
// 8 tiers × 3 sub-ranks = 24 níveis. O nível é um inteiro plano (1..24):
//   tier = ceil(nivel / 3)   sub = ((nivel - 1) % 3) + 1
// Espelha NIVEIS/TIERS em back/gamificacao_engine.js — alterar os dois juntos.
// `corAcento` é opcional: só o Olimpiano usa (ciano com realce dourado).

export const TIERS = [
    { tier: 1, nome: 'Mortal',     xpMin: 0,    cor: '#D08A45' },                       // bronze
    { tier: 2, nome: 'Atleta',     xpMin: 200,  cor: '#C3CAD3' },                       // prata
    { tier: 3, nome: 'Espartano',  xpMin: 500,  cor: '#E8B23A' },                       // ouro
    { tier: 4, nome: 'Herói',      xpMin: 1000, cor: '#4A90D9' },                       // azul
    { tier: 5, nome: 'Semideus',   xpMin: 1800, cor: '#22C58A' },                       // verde
    { tier: 6, nome: 'Atlas',      xpMin: 3000, cor: '#A77DF7' },                       // roxo
    { tier: 7, nome: 'Titã',       xpMin: 5000, cor: '#F1564B' },                       // vermelho
    { tier: 8, nome: 'Olimpiano',  xpMin: 8000, cor: '#2FD8E0', corAcento: '#FFD24D' }, // ciano + dourado
];

export const ROMANOS = ['I', 'II', 'III'];
export const SUBS    = 3;
const SPAN_TOPO      = 3000; // faixa de XP do último tier (1000 por sub-rank)

// Lore de cada tier (índice = tier - 1)
export const LORE_TIER = [
    'Todo herói começa aqui. O primeiro passo rumo ao Olimpo é dado por quem ainda não sabe do que é capaz.',
    'A disciplina venceu a preguiça. O corpo já obedece e treinar deixou de ser sacrifício.',
    'Disciplina de guerra. Você não negocia com a preguiça — nenhuma desculpa sobrevive ao seu treino.',
    'A constância virou lenda. Seu nome começa a ecoar entre os mortais.',
    'Sangue divino corre nas suas veias. Pouquíssimos chegam onde você chegou.',
    'Você carrega o peso do mundo nos ombros — e ainda pede mais uma série.',
    'Sua força desafia os próprios deuses. O chão treme quando você levanta.',
    'Você alcançou o topo do Olimpo. Agora é lenda entre os imortais.',
];

// Arte de cada rank. Enquanto a arte do sub-rank não existir, o componente cai
// no fallback do sub-rank 1 do mesmo tier (ver arteFallback).
export const artePath     = (tier, sub) => `/badge-nivel-${tier}-${sub}.png`;
export const arteFallback = (tier)      => `/badge-nivel-${tier}-1.png`;

// 24 níveis expandidos a partir dos tiers
export const NIVEIS = TIERS.flatMap((t, i) => {
    const span = (TIERS[i + 1] ? TIERS[i + 1].xpMin - t.xpMin : SPAN_TOPO) / SUBS;
    return ROMANOS.map((romano, s) => ({
        nivel:    i * SUBS + s + 1,
        tier:     t.tier,
        sub:      s + 1,
        romano,
        nomeTier: t.nome,
        nome:     `${t.nome} ${romano}`,
        cor:      t.cor,
        corAcento: t.corAcento || t.cor,
        xpMin:    Math.round(t.xpMin + span * s),
        arte:     artePath(t.tier, s + 1),
        lore:     LORE_TIER[i],
    }));
});

export const TOTAL_NIVEIS = NIVEIS.length; // 24
export const NOMES_NIVEL  = NIVEIS.map(n => n.nome);
export const XP_NIVEL     = NIVEIS.map(n => n.xpMin);
export const NOMES_TIER   = TIERS.map(t => t.nome);
export const COR_TIER     = Object.fromEntries(TIERS.map(t => [t.tier, t.cor]));

// Dados completos de um nível (1..24), com clamp.
export function infoNivel(nivel) {
    const n = Math.max(1, Math.min(TOTAL_NIVEIS, parseInt(nivel) || 1));
    const info    = NIVEIS[n - 1];
    const proximo = NIVEIS[n]; // undefined no último
    return {
        ...info,
        xpProx:  proximo ? proximo.xpMin : null,
        isMax:   !proximo,
        proximo: proximo || null,
    };
}

// Cor do rank a partir do nível plano (1..24)
export const corNivel = (nivel) => infoNivel(nivel).cor;
