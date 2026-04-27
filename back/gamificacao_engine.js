const db = require('./db');

// ── Níveis ────────────────────────────────────────────────────────────────────
const NIVEIS = [
    { nivel: 1, nome: 'Iniciante',  xpMin: 0    },
    { nivel: 2, nome: 'Aprendiz',   xpMin: 200  },
    { nivel: 3, nome: 'Dedicado',   xpMin: 500  },
    { nivel: 4, nome: 'Atleta',     xpMin: 1000 },
    { nivel: 5, nome: 'Avançado',   xpMin: 1800 },
    { nivel: 6, nome: 'Elite',      xpMin: 3000 },
    { nivel: 7, nome: 'Lendário',   xpMin: 5000 },
];

function calcNivel(xp) {
    let atual = NIVEIS[0];
    for (const n of NIVEIS) {
        if (xp >= n.xpMin) atual = n;
        else break;
    }
    const idx           = NIVEIS.indexOf(atual);
    const proximo       = NIVEIS[idx + 1];
    const xpNoNivel     = xp - atual.xpMin;
    const xpParaProximo = proximo ? proximo.xpMin - atual.xpMin : 1000;
    return { nivel: atual.nivel, nome: atual.nome, xpNoNivel, xpParaProximo, pct: Math.min(xpNoNivel / xpParaProximo, 1) };
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

module.exports = { calcNivel, processarEvento, getObjetivosComProgresso };
