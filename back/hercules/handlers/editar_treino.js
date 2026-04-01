const { normalizarDia } = require('../utils/dias');

async function handleEditarTreino({ args, usuarioId, pool }) {
    const { dia_semana, operacao, exercicio_atual, exercicio_novo, series, reps } = args;

    const dia = normalizarDia(dia_semana);

    // Busca o treino do dia
    const { rows: treinos } = await pool.query(
        `SELECT id, nome_treino FROM treinos WHERE usuario_id = $1 AND LOWER(dia_semana) = LOWER($2)`,
        [usuarioId, dia]
    );

    if (!treinos.length) {
        return { sucesso: false, erro: `Nenhum treino encontrado para ${dia}.` };
    }

    const treino = treinos[0];

    // ── REMOVER ──────────────────────────────────────────────────────────────
    if (operacao === 'remover') {
        const { rows: exRows } = await pool.query(
            `SELECT te.id FROM treinos_exercicios te
             JOIN exercicios e ON e.id = te.exercicio_id
             WHERE te.treino_id = $1 AND LOWER(e.nome_exercicio) = LOWER($2)`,
            [treino.id, exercicio_atual]
        );

        if (!exRows.length) return { sucesso: false, erro: `Exercício "${exercicio_atual}" não encontrado no treino.` };

        await pool.query(`DELETE FROM treinos_exercicios WHERE id = $1`, [exRows[0].id]);

        // Reordena
        await pool.query(
            `UPDATE treinos_exercicios SET ordem = sub.nova_ordem
             FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY ordem) AS nova_ordem FROM treinos_exercicios WHERE treino_id = $1) sub
             WHERE treinos_exercicios.id = sub.id`,
            [treino.id]
        );

        return { sucesso: true, operacao: 'remover', treino: treino.nome_treino, dia, exercicio_removido: exercicio_atual };
    }

    // ── SUBSTITUIR ────────────────────────────────────────────────────────────
    if (operacao === 'substituir') {
        const [exAtualRows, exNovoRows] = await Promise.all([
            pool.query(
                `SELECT te.id, te.ordem, te.series_alvo, te.reps_alvo FROM treinos_exercicios te
                 JOIN exercicios e ON e.id = te.exercicio_id
                 WHERE te.treino_id = $1 AND LOWER(e.nome_exercicio) = LOWER($2)`,
                [treino.id, exercicio_atual]
            ),
            pool.query(
                `SELECT id FROM exercicios WHERE LOWER(nome_exercicio) = LOWER($1) LIMIT 1`,
                [exercicio_novo]
            ),
        ]);

        if (!exAtualRows.rows.length) return { sucesso: false, erro: `Exercício "${exercicio_atual}" não encontrado no treino.` };
        if (!exNovoRows.rows.length) return { sucesso: false, erro: `Exercício "${exercicio_novo}" não encontrado no banco de dados.` };

        const teId = exAtualRows.rows[0].id;
        const novoExId = exNovoRows.rows[0].id;
        const seriesAlvo = series || exAtualRows.rows[0].series_alvo;
        const repsAlvo   = reps   || exAtualRows.rows[0].reps_alvo;

        await pool.query(
            `UPDATE treinos_exercicios SET exercicio_id = $1, series_alvo = $2, reps_alvo = $3 WHERE id = $4`,
            [novoExId, seriesAlvo, repsAlvo, teId]
        );

        return { sucesso: true, operacao: 'substituir', treino: treino.nome_treino, dia, de: exercicio_atual, para: exercicio_novo };
    }

    // ── ADICIONAR ─────────────────────────────────────────────────────────────
    if (operacao === 'adicionar') {
        const [exRows, ordemRows] = await Promise.all([
            pool.query(`SELECT id FROM exercicios WHERE LOWER(nome_exercicio) = LOWER($1) LIMIT 1`, [exercicio_novo]),
            pool.query(`SELECT COALESCE(MAX(ordem), 0) + 1 AS proxima FROM treinos_exercicios WHERE treino_id = $1`, [treino.id]),
        ]);

        if (!exRows.rows.length) return { sucesso: false, erro: `Exercício "${exercicio_novo}" não encontrado no banco de dados.` };

        await pool.query(
            `INSERT INTO treinos_exercicios (treino_id, exercicio_id, series_alvo, reps_alvo, ordem) VALUES ($1, $2, $3, $4, $5)`,
            [treino.id, exRows.rows[0].id, series || 3, reps || 12, ordemRows.rows[0].proxima]
        );

        return { sucesso: true, operacao: 'adicionar', treino: treino.nome_treino, dia, exercicio_adicionado: exercicio_novo, series: series || 3, reps: reps || 12 };
    }

    // ── ALTERAR SÉRIES/REPS ────────────────────────────────────────────────────
    if (operacao === 'alterar_series') {
        const { rows: exRows } = await pool.query(
            `SELECT te.id FROM treinos_exercicios te
             JOIN exercicios e ON e.id = te.exercicio_id
             WHERE te.treino_id = $1 AND LOWER(e.nome_exercicio) = LOWER($2)`,
            [treino.id, exercicio_atual]
        );

        if (!exRows.length) return { sucesso: false, erro: `Exercício "${exercicio_atual}" não encontrado no treino.` };

        await pool.query(
            `UPDATE treinos_exercicios SET series_alvo = COALESCE($1, series_alvo), reps_alvo = COALESCE($2, reps_alvo) WHERE id = $3`,
            [series || null, reps || null, exRows[0].id]
        );

        return { sucesso: true, operacao: 'alterar_series', treino: treino.nome_treino, dia, exercicio: exercicio_atual, series, reps };
    }

    return { sucesso: false, erro: `Operação "${operacao}" não reconhecida.` };
}

module.exports = { handleEditarTreino };
