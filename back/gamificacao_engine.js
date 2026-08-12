const db = require('./db');

// ── Níveis ────────────────────────────────────────────────────────────────────
// 8 tiers × 3 sub-ranks = 24 níveis. O nível é um inteiro plano (1..24):
//   tier = ceil(nivel / 3)   sub = ((nivel - 1) % 3) + 1
// Espelhado em front/src/views/components/rankInfo.js — alterar os dois juntos.
const TIERS = [
    { tier: 1, nome: 'Mortal',     xpMin: 0    },
    { tier: 2, nome: 'Atleta',     xpMin: 200  },
    { tier: 3, nome: 'Espartano',  xpMin: 500  },
    { tier: 4, nome: 'Herói',      xpMin: 1000 },
    { tier: 5, nome: 'Semideus',   xpMin: 1800 },
    { tier: 6, nome: 'Atlas',      xpMin: 3000 },
    { tier: 7, nome: 'Titã',       xpMin: 5000 },
    { tier: 8, nome: 'Olimpiano',  xpMin: 8000 },
];

const ROMANOS   = ['I', 'II', 'III'];
const SUBS      = 3;
// Faixa do último tier (não tem tier seguinte para delimitar): 3000 XP → 1000 por sub-rank
const SPAN_TOPO = 3000;

// Expande os tiers em 21 níveis, fatiando a faixa de XP de cada tier em 3 partes iguais.
const NIVEIS = TIERS.flatMap((t, i) => {
    const span = (TIERS[i + 1] ? TIERS[i + 1].xpMin - t.xpMin : SPAN_TOPO) / SUBS;
    return ROMANOS.map((romano, s) => ({
        nivel:    i * SUBS + s + 1,
        tier:     t.tier,
        sub:      s + 1,
        nomeTier: t.nome,
        nome:     `${t.nome} ${romano}`,
        xpMin:    Math.round(t.xpMin + span * s),
    }));
});

function calcNivel(xp) {
    let atual = NIVEIS[0];
    for (const n of NIVEIS) {
        if (xp >= n.xpMin) atual = n;
        else break;
    }
    const proximo       = NIVEIS[atual.nivel]; // nivel é 1-based → índice do próximo
    const xpNoNivel     = xp - atual.xpMin;
    const xpParaProximo = proximo ? proximo.xpMin - atual.xpMin : SPAN_TOPO / SUBS;
    return {
        nivel:    atual.nivel,
        nome:     atual.nome,
        nomeTier: atual.nomeTier,
        tier:     atual.tier,
        sub:      atual.sub,
        xpNoNivel,
        xpParaProximo,
        pct: Math.min(xpNoNivel / xpParaProximo, 1),
    };
}

// ── Objetivos ─────────────────────────────────────────────────────────────────
// Para adicionar um novo objetivo: adicione um objeto neste array.
// Campos obrigatórios: id, nome, descricao, xp, tipo ('diario'|'semanal'), icone, eventos[], calcular()

const OBJETIVOS = [

    // ── Diários ──────────────────────────────────────────────────
    {
        id:       'treino_dia',
        nome:     'Finalizar treino',
        descricao:'Complete um treino hoje',
        xp:       50,
        tipo:     'diario',
        icone:    'dumbbell',
        eventos:  ['treino_finalizado'],
        calcular: async (userId) => {
            const { rows } = await db.query(
                `SELECT COUNT(*) FROM treinos_realizados
                 WHERE usuario_id = $1 AND finalizado_em IS NOT NULL
                 AND data::date = CURRENT_DATE`,
                [userId]
            );
            return { progresso: Math.min(parseInt(rows[0].count), 1), total: 1 };
        },
    },

    {
        id:       'meta_agua',
        nome:     'Meta de água',
        descricao:'Bata sua meta de hidratação hoje',
        xp:       10,
        tipo:     'diario',
        icone:    'water',
        eventos:  ['agua_adicionada'],
        calcular: async (userId) => {
            const [metaRes, aguaRes] = await Promise.all([
                db.query(`SELECT COALESCE(meta_agua_ml, 2500) AS meta FROM usuarios WHERE id = $1`, [userId]),
                db.query(
                    `SELECT COALESCE(SUM(ml), 0) AS total FROM agua_registros
                     WHERE usuario_id = $1 AND DATE(created_at AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE`,
                    [userId]
                ),
            ]);
            return {
                progresso: parseInt(aguaRes.rows[0].total),
                total:     parseInt(metaRes.rows[0].meta),
            };
        },
    },

    {
        id:       'registrar_cardio',
        nome:     'Registrar cardio',
        descricao:'Faça um registro de cardio hoje',
        xp:       15,
        tipo:     'diario',
        icone:    'cardio',
        eventos:  ['cardio_registrado'],
        calcular: async (userId) => {
            const { rows } = await db.query(
                `SELECT COUNT(*) FROM cardio_sessoes
                 WHERE usuario_id = $1 AND data = CURRENT_DATE`,
                [userId]
            );
            return { progresso: Math.min(parseInt(rows[0].count), 1), total: 1 };
        },
    },

    // ── Semanais ─────────────────────────────────────────────────
    {
        id:       'treinos_semana_3',
        nome:     '3 treinos na semana',
        descricao:'Complete 3 treinos essa semana',
        xp:       75,
        tipo:     'semanal',
        icone:    'calendar',
        eventos:  ['treino_finalizado'],
        calcular: async (userId) => {
            const { rows } = await db.query(
                `SELECT COUNT(DISTINCT data::date) AS dias FROM treinos_realizados
                 WHERE usuario_id = $1 AND finalizado_em IS NOT NULL
                 AND data::date >= date_trunc('week', CURRENT_DATE)`,
                [userId]
            );
            return { progresso: Math.min(parseInt(rows[0].dias), 3), total: 3 };
        },
    },

    {
        id:       'treinos_semana_5',
        nome:     '5 treinos na semana',
        descricao:'Complete 5 treinos essa semana',
        xp:       150,
        tipo:     'semanal',
        icone:    'calendar',
        eventos:  ['treino_finalizado'],
        calcular: async (userId) => {
            const { rows } = await db.query(
                `SELECT COUNT(DISTINCT data::date) AS dias FROM treinos_realizados
                 WHERE usuario_id = $1 AND finalizado_em IS NOT NULL
                 AND data::date >= date_trunc('week', CURRENT_DATE)`,
                [userId]
            );
            return { progresso: Math.min(parseInt(rows[0].dias), 5), total: 5 };
        },
    },

    {
        id:       'grupos_semana',
        nome:     'Variedade muscular',
        descricao:'Treine 4 grupos musculares diferentes essa semana',
        xp:       100,
        tipo:     'semanal',
        icone:    'muscle',
        eventos:  ['treino_finalizado'],
        calcular: async (userId) => {
            const { rows } = await db.query(
                `SELECT COUNT(DISTINCT t.grupo_muscular) AS grupos
                 FROM treinos_realizados tr
                 JOIN treinos t ON t.id = tr.treino_id
                 WHERE tr.usuario_id = $1 AND tr.finalizado_em IS NOT NULL
                 AND tr.data::date >= date_trunc('week', CURRENT_DATE)
                 AND t.grupo_muscular IS NOT NULL`,
                [userId]
            );
            return { progresso: Math.min(parseInt(rows[0].grupos), 4), total: 4 };
        },
    },

];

// ── Helpers ───────────────────────────────────────────────────────────────────
const periodoExpr = (tipo) =>
    tipo === 'diario' ? 'CURRENT_DATE' : "date_trunc('week', CURRENT_DATE)::date";

async function atualizarNivel(userId) {
    const { rows } = await db.query(
        `SELECT xp_total FROM gamificacao_usuario WHERE usuario_id = $1`, [userId]
    );
    if (!rows.length) return;
    const { nivel } = calcNivel(rows[0].xp_total);
    await db.query(`UPDATE gamificacao_usuario SET nivel = $1 WHERE usuario_id = $2`, [nivel, userId]);
}

// ── Engine principal ──────────────────────────────────────────────────────────
// Chame ao ocorrer um evento: processarEvento('treino_finalizado', userId)
async function processarEvento(evento, userId) {
    const relevantes = OBJETIVOS.filter(o => o.eventos.includes(evento));
    let xpGanho = 0;
    const completados = [];

    for (const obj of relevantes) {
        try {
            const { progresso, total } = await obj.calcular(userId);
            const completo    = progresso >= total;
            const periodo     = periodoExpr(obj.tipo);

            // Upsert progresso — não reduz progresso já salvo
            const { rows } = await db.query(
                `INSERT INTO objetivos_progresso
                    (usuario_id, objetivo_id, periodo, progresso, completo, xp_creditado)
                 VALUES ($1, $2, ${periodo}, $3, $4, false)
                 ON CONFLICT (usuario_id, objetivo_id, periodo) DO UPDATE SET
                     progresso = GREATEST(objetivos_progresso.progresso, $3),
                     completo  = $4
                 RETURNING xp_creditado`,
                [userId, obj.id, progresso, completo]
            );

            // Credita XP uma única vez por período
            if (completo && !rows[0].xp_creditado) {
                await db.query(
                    `UPDATE objetivos_progresso SET xp_creditado = true
                     WHERE usuario_id = $1 AND objetivo_id = $2 AND periodo = ${periodo}`,
                    [userId, obj.id]
                );

                await db.query(
                    `INSERT INTO gamificacao_usuario
                        (usuario_id, xp_total, nivel, streak_atual, maior_streak)
                     VALUES ($1, $2, 1, 0, 0)
                     ON CONFLICT (usuario_id) DO UPDATE SET
                         xp_total = gamificacao_usuario.xp_total + $2`,
                    [userId, obj.xp]
                );

                xpGanho += obj.xp;
                completados.push({ id: obj.id, nome: obj.nome, xp: obj.xp });
            }
        } catch (err) {
            console.error(`[engine] Erro no objetivo ${obj.id}:`, err.message);
        }
    }

    if (xpGanho > 0) await atualizarNivel(userId);

    return { xp_ganho: xpGanho, completados };
}

// ── Leitura de progresso (para a tela) ────────────────────────────────────────
async function getObjetivosComProgresso(userId) {
    const { rows: dbRows } = await db.query(
        `SELECT objetivo_id, xp_creditado FROM objetivos_progresso
         WHERE usuario_id = $1
           AND (periodo = CURRENT_DATE OR periodo = date_trunc('week', CURRENT_DATE)::date)`,
        [userId]
    );
    const creditadoMap = Object.fromEntries(dbRows.map(r => [r.objetivo_id, r.xp_creditado]));

    const resultados = await Promise.all(
        OBJETIVOS.map(async (obj) => {
            try {
                const { progresso, total } = await obj.calcular(userId);
                return {
                    id:           obj.id,
                    nome:         obj.nome,
                    descricao:    obj.descricao,
                    xp:           obj.xp,
                    tipo:         obj.tipo,
                    icone:        obj.icone,
                    progresso,
                    total,
                    completo:     progresso >= total,
                    xp_creditado: creditadoMap[obj.id] || false,
                };
            } catch {
                return {
                    id: obj.id, nome: obj.nome, descricao: obj.descricao,
                    xp: obj.xp, tipo: obj.tipo, icone: obj.icone,
                    progresso: 0, total: 1, completo: false, xp_creditado: false,
                };
            }
        })
    );

    return resultados;
}

module.exports = { calcNivel, processarEvento, getObjetivosComProgresso, NIVEIS, TIERS };
