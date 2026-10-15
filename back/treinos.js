const express = require('express');
const db = require('./db');
const { enviarPush } = require('./push');
const { processarEvento } = require('./gamificacao_engine');
const { hojeSP, diaSemanaSP, SQL_HOJE } = require('./config/datas');
const {
    authenticate, requireVinculo, verificarVinculo,
    autorizarTreino, autorizarTreinoRealizado,
} = require('./middleware/auth');

const router = express.Router();

// Todas as rotas deste router exigem login
router.use(authenticate);

const GRUPO_PARA_IMAGEM = {
    Peitoral: 'peito.png',
    Costas: 'costas.png',
    Ombros: 'ombros.png',
    Bíceps: 'biceps.png',
    Tríceps: 'triceps.png',
    Pernas: 'perna.png',
    Panturrilha: 'panturrilha.png',
    Abdômen: 'abdomen.png',
};
const imagemDoGrupo = (grupo) => GRUPO_PARA_IMAGEM[grupo] || 'default.png';

// Colunas que o PATCH genérico pode alterar (nunca usuario_id / id)
const CAMPOS_EDITAVEIS = ['nome_treino', 'descricao', 'dia_semana', 'grupo_muscular', 'grupos_auxiliares'];

const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

// Número ou null ('' e undefined viram null; lixo vira NaN e é rejeitado)
const numeroOuNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

// ── TREINOS ────────────────────────────────────────────────────────────────

// Rota para obter informação de treino
router.get('/treinos/:id', async (req, res) => {
    const treino = await autorizarTreino(req, res, req.params.id, 'leitura');
    if (!treino) return;
    res.json(treino);
});

// Rota para criar um treino para um aluno
router.post('/usuarios/:usuarioId/treinos', requireVinculo('usuarioId'), async (req, res) => {
    const { usuarioId } = req.params;
    const { nome_treino, descricao, dia_semana, grupo_muscular, grupos_auxiliares } = req.body;

    if (typeof nome_treino !== 'string' || !nome_treino.trim()) {
        return res.status(400).json({ error: 'Nome do treino é obrigatório.' });
    }
    const auxiliares = Array.isArray(grupos_auxiliares) ? grupos_auxiliares : [];

    const result = await db.query(
        `INSERT INTO treinos (usuario_id, nome_treino, descricao, dia_semana, grupo_muscular, imagem, grupos_auxiliares)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [usuarioId, nome_treino.trim(), descricao, dia_semana, grupo_muscular, imagemDoGrupo(grupo_muscular), auxiliares]
    );

    const treino = result.rows[0];
    req.io?.to(`user_${usuarioId}`).emit('atualizar_tela', { tipo: 'treinos' });
    if (String(req.user.userId) !== String(usuarioId)) {
        await enviarPush(usuarioId, {
            title: 'Novo treino criado!',
            body: treino.nome_treino,
            url: `/usuarios/view/${usuarioId}`
        });
    }
    res.status(201).json(treino);
});

router.put('/treinos/:treinoId', async (req, res) => {
    const { treinoId } = req.params;
    const { nome_treino, descricao, dia_semana, grupo_muscular, grupos_auxiliares } = req.body;

    if (!(await autorizarTreino(req, res, treinoId))) return;

    const auxiliares = Array.isArray(grupos_auxiliares) ? grupos_auxiliares : [];
    const result = await db.query(
        `UPDATE treinos
         SET nome_treino = $1, descricao = $2, dia_semana = $3, grupo_muscular = $4,
             imagem = $5, grupos_auxiliares = $6
         WHERE id = $7
         RETURNING *`,
        [nome_treino, descricao, dia_semana, grupo_muscular, imagemDoGrupo(grupo_muscular), auxiliares, treinoId]
    );

    const treino = result.rows[0];
    req.io?.to(`user_${treino.usuario_id}`).emit('atualizar_tela', { tipo: 'treinos' });
    // Só avisa o aluno quando foi outra pessoa (o professor) que mexeu
    if (String(req.user.userId) !== String(treino.usuario_id)) {
        await enviarPush(treino.usuario_id, {
            title: 'Treino atualizado',
            body: treino.nome_treino,
            url: `/usuarios/view/${treino.usuario_id}`
        });
    }
    res.json(treino);
});

// Copiar um treino (próprio ou de um amigo) para a conta do usuário logado
// POST /treinos/treinos/:treinoId/copiar   body: { dia_semana }
router.post('/treinos/:treinoId/copiar', async (req, res) => {
    const { treinoId } = req.params;
    const { dia_semana } = req.body;
    const destinoId = parseInt(req.user.userId);

    // Autorização: dono, professor vinculado ou amigo aceito
    const origem = await autorizarTreino(req, res, treinoId, 'leitura');
    if (!origem) return;

    const novoTreino = await db.transaction(async (tx) => {
        const novoRes = await tx.query(
            `INSERT INTO treinos (usuario_id, nome_treino, descricao, dia_semana, grupo_muscular, imagem, grupos_auxiliares)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [destinoId, origem.nome_treino, origem.descricao, dia_semana || null,
             origem.grupo_muscular, origem.imagem, origem.grupos_auxiliares || []]
        );
        const novo = novoRes.rows[0];

        // Clona os exercícios (mantém series_alvo, reps_alvo e ordem)
        await tx.query(
            `INSERT INTO treinos_exercicios (treino_id, exercicio_id, series_alvo, reps_alvo, ordem)
             SELECT $1, exercicio_id, series_alvo, reps_alvo, ordem
             FROM treinos_exercicios
             WHERE treino_id = $2`,
            [novo.id, treinoId]
        );
        return novo;
    });

    req.io?.to(`user_${destinoId}`).emit('atualizar_tela', { tipo: 'treinos' });
    res.status(201).json(novoTreino);
});

// Rota para fazer swap (troca) de treinos entre dias
router.patch('/swap', async (req, res) => {
    const { treino1_id, treino2_id, dia1, dia2 } = req.body;

    if (!treino1_id || !treino2_id || !dia1 || !dia2) {
        return res.status(400).json({
            error: 'Parâmetros obrigatórios: treino1_id, treino2_id, dia1, dia2'
        });
    }

    const t1 = await autorizarTreino(req, res, treino1_id);
    if (!t1) return;
    const t2 = await autorizarTreino(req, res, treino2_id);
    if (!t2) return;
    if (String(t1.usuario_id) !== String(t2.usuario_id)) {
        return res.status(400).json({ error: 'Os treinos precisam ser do mesmo usuário.' });
    }

    await db.transaction(async (tx) => {
        // Valor temporário evita colisão de dia_semana durante a troca
        await tx.query('UPDATE treinos SET dia_semana = $1 WHERE id = $2', ['__TEMP_SWAP__', treino1_id]);
        await tx.query('UPDATE treinos SET dia_semana = $1 WHERE id = $2', [dia1, treino2_id]);
        await tx.query('UPDATE treinos SET dia_semana = $1 WHERE id = $2', [dia2, treino1_id]);
    });

    res.json({ success: true, message: 'Treinos trocados com sucesso' });
});

// atualizar so dia da semana
router.patch('/:treinoId/dia', async (req, res) => {
    const { treinoId } = req.params;
    const { dia_semana } = req.body;

    if (!(await autorizarTreino(req, res, treinoId))) return;

    const result = await db.query(
        'UPDATE treinos SET dia_semana = $1 WHERE id = $2 RETURNING *',
        [dia_semana, treinoId]
    );
    res.json(result.rows[0]);
});

// PATCH genérico - atualiza apenas os campos enviados (lista fechada de colunas)
router.patch('/treinos/:treinoId', async (req, res) => {
    const { treinoId } = req.params;
    const body = req.body || {};

    const recebidos = Object.keys(body);
    const invalidos = recebidos.filter(c => !CAMPOS_EDITAVEIS.includes(c));
    if (invalidos.length) {
        return res.status(400).json({ error: `Campo(s) não editável(is): ${invalidos.join(', ')}` });
    }
    if (recebidos.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo enviado para atualização.' });
    }

    if (!(await autorizarTreino(req, res, treinoId))) return;

    const campos = { ...body };
    // A imagem acompanha o grupo muscular
    if (campos.grupo_muscular !== undefined) campos.imagem = imagemDoGrupo(campos.grupo_muscular);

    const colunas = Object.keys(campos); // todas vêm da whitelist acima
    const valores = Object.values(campos);
    const set = colunas.map((col, idx) => `${col} = $${idx + 1}`).join(', ');

    const result = await db.query(
        `UPDATE treinos SET ${set} WHERE id = $${valores.length + 1} RETURNING *`,
        [...valores, treinoId]
    );
    res.json(result.rows[0]);
});

// Rota para deletar um treino
router.delete('/treinos/:id', async (req, res) => {
    const { id } = req.params;
    if (!(await autorizarTreino(req, res, id))) return;

    const result = await db.query('DELETE FROM treinos WHERE id = $1 RETURNING *', [id]);
    const usuarioId = result.rows[0].usuario_id;
    req.io?.to(`user_${usuarioId}`).emit('atualizar_tela', { tipo: 'treinos' });
    res.json({ message: 'Treino excluído com sucesso', treino: result.rows[0] });
});

// Rota para listar todos os treinos de um aluno
router.get('/usuarios/:usuarioId/treinos', requireVinculo('usuarioId'), async (req, res) => {
    const result = await db.query('SELECT * FROM treinos WHERE usuario_id = $1', [req.params.usuarioId]);
    res.json(result.rows);
});

// ── EXERCÍCIOS DO TREINO ───────────────────────────────────────────────────

// Rota para adicionar múltiplos exercícios a um treino
router.post('/treinos/:treinoId/exercicios', async (req, res) => {
    const { treinoId } = req.params;
    const { exercicios } = req.body; // array de ids ou de { id, series_alvo, reps_alvo }

    if (!Array.isArray(exercicios) || exercicios.length === 0) {
        return res.status(400).json({ error: 'É necessário fornecer uma lista de exercícios.' });
    }
    if (!(await autorizarTreino(req, res, treinoId))) return;

    await db.transaction(async (tx) => {
        const { rows } = await tx.query(
            'SELECT COUNT(*)::int AS total FROM treinos_exercicios WHERE treino_id = $1',
            [treinoId]
        );
        let ordem = rows[0].total;
        for (const item of exercicios) {
            const ehObjeto = item !== null && typeof item === 'object';
            await tx.query(
                'INSERT INTO treinos_exercicios (treino_id, exercicio_id, series_alvo, reps_alvo, ordem) VALUES ($1, $2, $3, $4, $5)',
                [
                    treinoId,
                    ehObjeto ? item.id : item,
                    ehObjeto ? (item.series_alvo || null) : null,
                    ehObjeto ? (item.reps_alvo || null) : null,
                    ordem++,
                ]
            );
        }
    });

    res.status(201).json({ message: 'Exercícios adicionados ao treino com sucesso' });
});

// Rota para salvar a ordem dos exercícios de um treino
router.put('/treinos/:treinoId/exercicios/ordem', async (req, res) => {
    const { treinoId } = req.params;
    const { ordem } = req.body; // array de exercicio_id na nova ordem

    if (!Array.isArray(ordem) || ordem.length === 0) {
        return res.status(400).json({ error: 'ordem deve ser um array de exercicio_id' });
    }
    if (!(await autorizarTreino(req, res, treinoId))) return;

    await db.transaction(async (tx) => {
        for (let i = 0; i < ordem.length; i++) {
            await tx.query(
                'UPDATE treinos_exercicios SET ordem = $1 WHERE treino_id = $2 AND exercicio_id = $3',
                [i, treinoId, ordem[i]]
            );
        }
    });
    res.json({ ok: true });
});

// Rota para listar todos os exercícios de um treino específico
router.get('/treinos/:treinoId/exercicios', async (req, res) => {
    const { treinoId } = req.params;
    if (!(await autorizarTreino(req, res, treinoId, 'leitura'))) return;

    const result = await db.query(
        `SELECT te.exercicio_id, e.nome_exercicio, e.grupo_muscular, e.gif_url,
                te.series_alvo, te.reps_alvo
         FROM treinos_exercicios te
         JOIN exercicios e ON te.exercicio_id = e.id
         WHERE te.treino_id = $1
         ORDER BY te.ordem ASC`,
        [treinoId]
    );
    res.json(result.rows);
});

router.patch('/treinos/:treinoId/exercicios/:exercicioId', async (req, res) => {
    const { treinoId, exercicioId } = req.params;
    const { series_alvo, reps_alvo } = req.body;
    if (!(await autorizarTreino(req, res, treinoId))) return;

    const result = await db.query(
        `UPDATE treinos_exercicios
         SET series_alvo = $1, reps_alvo = $2
         WHERE treino_id = $3 AND exercicio_id = $4
         RETURNING *`,
        [series_alvo ?? null, reps_alvo ?? null, treinoId, exercicioId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Exercício não encontrado no treino.' });
    res.json(result.rows[0]);
});

router.delete('/treinos/:treinoId/exercicios/:exercicioId', async (req, res) => {
    const { treinoId, exercicioId } = req.params;
    if (!(await autorizarTreino(req, res, treinoId))) return;

    const result = await db.query(
        'DELETE FROM treinos_exercicios WHERE treino_id = $1 AND exercicio_id = $2 RETURNING *',
        [treinoId, exercicioId]
    );
    if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Exercício não encontrado no treino.' });
    }
    res.status(200).json({ message: 'Exercício removido com sucesso.', exercicio: result.rows[0] });
});

// ── SÉRIES ─────────────────────────────────────────────────────────────────

// Substitui as séries de um exercício numa sessão de treino
router.post('/usuarios/:usuarioId/treinos/:treinoId/exercicios/:exercicioId/series', requireVinculo('usuarioId'), async (req, res) => {
    const { usuarioId, treinoId, exercicioId } = req.params;
    const { series, treino_realizado_id } = req.body;

    if (!Array.isArray(series)) {
        return res.status(400).json({ error: 'É necessário fornecer uma lista de séries.' });
    }
    if (!treino_realizado_id) {
        return res.status(400).json({ error: 'treino_realizado_id é obrigatório.' });
    }

    const normalizadas = series.map(s => ({
        numero_serie: parseInt(s.numero_serie),
        carga: numeroOuNull(s.carga),
        repeticoes: numeroOuNull(s.repeticoes),
    }));
    const invalida = normalizadas.some(s =>
        !Number.isInteger(s.numero_serie) || s.numero_serie < 1 ||
        Number.isNaN(s.carga) || Number.isNaN(s.repeticoes) ||
        (s.carga !== null && s.carga < 0) || (s.repeticoes !== null && s.repeticoes < 0)
    );
    if (invalida) return res.status(400).json({ error: 'Série com valores inválidos.' });

    const ok = await db.transaction(async (tx) => {
        // Trava a sessão: saves simultâneos do mesmo exercício passam a ser
        // serializados (antes podiam intercalar DELETE/INSERT e duplicar séries)
        const { rows } = await tx.query(
            `SELECT to_char(data::date, 'YYYY-MM-DD') AS data FROM treinos_realizados
             WHERE id = $1 AND usuario_id = $2 AND treino_id = $3
             FOR UPDATE`,
            [treino_realizado_id, usuarioId, treinoId]
        );
        if (!rows.length) return false;

        await tx.query(
            `DELETE FROM series_usuario
             WHERE usuario_id = $1 AND treino_id = $2 AND exercicio_id = $3
               AND treino_realizado_id = $4`,
            [usuarioId, treinoId, exercicioId, treino_realizado_id]
        );

        // data_treino = dia da sessão (num treino reaberto, não vira "hoje")
        for (const s of normalizadas) {
            await tx.query(
                `INSERT INTO series_usuario
                 (usuario_id, treino_id, exercicio_id, numero_serie, carga, repeticoes, data_treino, treino_realizado_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [usuarioId, treinoId, exercicioId, s.numero_serie, s.carga, s.repeticoes, rows[0].data, treino_realizado_id]
            );
        }
        return true;
    });

    if (!ok) return res.status(404).json({ error: 'Sessão de treino não encontrada.' });
    res.status(201).json({ message: 'Séries registradas ou atualizadas com sucesso.' });
});

router.get('/usuarios/:usuarioId/treinos/:treinoId/exercicios/:exercicioId/series', requireVinculo('usuarioId'), async (req, res) => {
    const { usuarioId, treinoId, exercicioId } = req.params;
    const { data, treino_realizado_id } = req.query;

    let result;
    if (treino_realizado_id) {
        result = await db.query(
            `SELECT numero_serie, carga, repeticoes, data_treino
             FROM series_usuario
             WHERE usuario_id = $1 AND treino_id = $2 AND exercicio_id = $3
               AND treino_realizado_id = $4
             ORDER BY numero_serie`,
            [usuarioId, treinoId, exercicioId, treino_realizado_id]
        );
    } else if (data) {
        result = await db.query(
            `SELECT numero_serie, carga, repeticoes, data_treino
             FROM series_usuario
             WHERE usuario_id = $1 AND treino_id = $2 AND exercicio_id = $3 AND data_treino = $4
             ORDER BY numero_serie`,
            [usuarioId, treinoId, exercicioId, data]
        );
    } else {
        result = await db.query(
            `SELECT numero_serie, carga, repeticoes, data_treino
             FROM series_usuario
             WHERE usuario_id = $1 AND treino_id = $2 AND exercicio_id = $3
             AND treino_realizado_id = (
                 SELECT id FROM treinos_realizados
                 WHERE usuario_id = $1 AND treino_id = $2
                 ORDER BY data DESC, id DESC
                 LIMIT 1
             )
             ORDER BY numero_serie`,
            [usuarioId, treinoId, exercicioId]
        );
    }

    res.json(result.rows);
});

// ── SESSÕES (treinos_realizados) ───────────────────────────────────────────

router.post('/usuarios/:usuarioId/treinos/:treinoId/iniciar', requireVinculo('usuarioId'), async (req, res) => {
    const { usuarioId, treinoId } = req.params;
    const dataHoje = hojeSP();

    const treino = await db.query('SELECT 1 FROM treinos WHERE id = $1 AND usuario_id = $2', [treinoId, usuarioId]);
    if (!treino.rows.length) return res.status(404).json({ error: 'Treino não encontrado' });

    // Finaliza qualquer treino em aberto de dias anteriores
    await db.query(
        `UPDATE treinos_realizados
         SET finalizado_em = NOW()
         WHERE usuario_id = $1 AND finalizado_em IS NULL AND data::date < $2::date`,
        [usuarioId, dataHoje]
    );

    // Verifica se já existe um treino em andamento
    const { rows } = await db.query(
        `SELECT * FROM treinos_realizados
         WHERE usuario_id = $1 AND treino_id = $2 AND data::date = $3::date AND finalizado_em IS NULL`,
        [usuarioId, treinoId, dataHoje]
    );
    if (rows.length > 0) {
        return res.status(200).json({ treinoRealizado: rows[0], existente: true });
    }

    const insert = await db.query(
        `INSERT INTO treinos_realizados (usuario_id, treino_id, data)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [usuarioId, treinoId, dataHoje]
    );
    res.status(201).json({ treinoRealizado: insert.rows[0], existente: false });
});

router.post('/treinos_realizados/:id/reabrir', async (req, res) => {
    const { id } = req.params;
    if (!(await autorizarTreinoRealizado(req, res, id))) return;
    await db.query('UPDATE treinos_realizados SET finalizado_em = NULL WHERE id = $1', [id]);
    res.status(200).json({ message: 'Treino reaberto.' });
});

router.post('/treinos_realizados/:id/finalizar', async (req, res) => {
    const { id } = req.params;
    const sessao = await autorizarTreinoRealizado(req, res, id);
    if (!sessao) return;

    await db.query('UPDATE treinos_realizados SET finalizado_em = NOW() WHERE id = $1', [id]);
    const usuario_id = sessao.usuario_id;

    // Upsert streak (dias no fuso do Brasil)
    const { rows: streakRows } = await db.query(
        `INSERT INTO gamificacao_usuario (usuario_id, streak_atual, maior_streak, ultimo_treino_data)
         VALUES ($1, 1, 1, ${SQL_HOJE})
         ON CONFLICT (usuario_id) DO UPDATE SET
             streak_atual = CASE
                 WHEN gamificacao_usuario.ultimo_treino_data = ${SQL_HOJE}
                     THEN gamificacao_usuario.streak_atual
                 WHEN gamificacao_usuario.ultimo_treino_data = ${SQL_HOJE} - 1
                     THEN gamificacao_usuario.streak_atual + 1
                 ELSE 1
             END,
             maior_streak = GREATEST(
                 gamificacao_usuario.maior_streak,
                 CASE
                     WHEN gamificacao_usuario.ultimo_treino_data = ${SQL_HOJE}
                         THEN gamificacao_usuario.streak_atual
                     WHEN gamificacao_usuario.ultimo_treino_data = ${SQL_HOJE} - 1
                         THEN gamificacao_usuario.streak_atual + 1
                     ELSE 1
                 END
             ),
             ultimo_treino_data = ${SQL_HOJE}
         RETURNING streak_atual, maior_streak`,
        [usuario_id]
    );

    // Engine de gamificação — credita XP dos objetivos
    const gamResult = await processarEvento('treino_finalizado', usuario_id);

    const streak = streakRows[0] || {};
    res.status(200).json({
        message:      'Treino finalizado com sucesso.',
        streak_atual: streak.streak_atual,
        maior_streak: streak.maior_streak,
        xp_ganho:     gamResult.xp_ganho,
        completados:  gamResult.completados,
    });
});

// ── OBSERVAÇÕES POR EXERCÍCIO ──────────────────────────────────────────────

router.get('/treinos_realizados/:treinoRealizadoId/obs', async (req, res) => {
    const { treinoRealizadoId } = req.params;
    if (!(await autorizarTreinoRealizado(req, res, treinoRealizadoId))) return;
    const { rows } = await db.query(
        'SELECT exercicio_id, observacao FROM obs_exercicio WHERE treino_realizado_id = $1',
        [treinoRealizadoId]
    );
    res.json(rows);
});

router.post('/treinos_realizados/:treinoRealizadoId/exercicios/:exercicioId/obs', async (req, res) => {
    const { treinoRealizadoId, exercicioId } = req.params;
    const { observacao } = req.body;
    if (!(await autorizarTreinoRealizado(req, res, treinoRealizadoId))) return;
    await db.query(
        `INSERT INTO obs_exercicio (treino_realizado_id, exercicio_id, observacao)
         VALUES ($1, $2, $3)
         ON CONFLICT (treino_realizado_id, exercicio_id)
         DO UPDATE SET observacao = EXCLUDED.observacao, updated_at = NOW()`,
        [treinoRealizadoId, exercicioId, observacao]
    );
    res.json({ ok: true });
});

router.get('/usuarios/:usuarioId/treino-ativo', requireVinculo('usuarioId'), async (req, res) => {
    const { usuarioId } = req.params;
    const { rows } = await db.query(
        `SELECT tr.id AS treino_realizado_id, tr.treino_id, tr.data,
                t.nome_treino, t.imagem, t.grupo_muscular, t.dia_semana
         FROM treinos_realizados tr
         JOIN treinos t ON t.id = tr.treino_id
         WHERE tr.usuario_id = $1 AND tr.finalizado_em IS NULL AND tr.data::date = $2::date
         ORDER BY tr.data DESC
         LIMIT 1`,
        [usuarioId, hojeSP()]
    );
    if (rows.length > 0) {
        const todayName = DIAS_SEMANA[diaSemanaSP()];
        return res.json({ ativo: true, isToday: rows[0].dia_semana === todayName, ...rows[0] });
    }
    res.json({ ativo: false });
});

router.get('/usuarios/:usuarioId/treinos/:treinoId/ativo', requireVinculo('usuarioId'), async (req, res) => {
    const { usuarioId, treinoId } = req.params;
    const { rows } = await db.query(
        `SELECT * FROM treinos_realizados
         WHERE usuario_id = $1 AND treino_id = $2 AND data::date = $3::date AND finalizado_em IS NULL
         LIMIT 1`,
        [usuarioId, treinoId, hojeSP()]
    );
    if (rows.length > 0) {
        return res.status(200).json({ ativo: true, treinoRealizadoId: rows[0].id });
    }
    res.status(200).json({ ativo: false });
});

// Rota para buscar treinos finalizados com séries registradas
router.get('/usuarios/:usuarioId/treinos/:treinoId/finalizados', requireVinculo('usuarioId'), async (req, res) => {
    const { usuarioId, treinoId } = req.params;
    const result = await db.query(
        `SELECT tr.id, tr.data
         FROM treinos_realizados tr
                  JOIN series_usuario su ON su.treino_realizado_id = tr.id
         WHERE tr.usuario_id = $1
           AND tr.treino_id = $2
           AND tr.finalizado_em IS NOT NULL
         GROUP BY tr.id
         ORDER BY tr.data DESC`,
        [usuarioId, treinoId]
    );
    res.status(200).json(result.rows);
});

// Rota para listar todos os treinos realizados por um usuário em um treino específico
router.get('/treinos_realizados', async (req, res) => {
    const { usuario_id, treino_id } = req.query;

    if (!usuario_id || !treino_id) {
        return res.status(400).json({ error: 'Parâmetros usuario_id e treino_id são obrigatórios.' });
    }
    if (!(await verificarVinculo(req, usuario_id))) {
        return res.status(403).json({ error: 'Acesso não autorizado.' });
    }

    const result = await db.query(
        `SELECT *
         FROM treinos_realizados
         WHERE usuario_id = $1 AND treino_id = $2
         ORDER BY data DESC`,
        [usuario_id, treino_id]
    );
    res.status(200).json(result.rows);
});

// ── HISTÓRICO / ESTATÍSTICAS ───────────────────────────────────────────────

// GET /usuarios/:usuarioId/exercicios_realizados
router.get('/usuarios/:usuarioId/exercicios_realizados', requireVinculo('usuarioId'), async (req, res) => {
    const result = await db.query(`
      SELECT DISTINCT
        e.id AS exercicio_id,
        e.nome_exercicio,
        e.grupo_muscular,
        e.gif_url
      FROM series_usuario su
      JOIN exercicios e ON e.id = su.exercicio_id
      WHERE su.usuario_id = $1
      ORDER BY e.nome_exercicio;
    `, [req.params.usuarioId]);
    res.json(result.rows);
});

// GET /usuarios/:usuarioId/exercicios/:exercicioId/historico
router.get('/usuarios/:usuarioId/exercicios/:exercicioId/historico', requireVinculo('usuarioId'), async (req, res) => {
    const { usuarioId, exercicioId } = req.params;
    const result = await db.query(`
      SELECT
        s.data_treino,
        s.numero_serie,
        s.carga,
        s.repeticoes,
        s.treino_realizado_id,
        COALESCE(t.nome_treino, 'Treino removido') AS nome_treino,
        te.series_alvo,
        te.reps_alvo
      FROM series_usuario s
      LEFT JOIN treinos t ON t.id = s.treino_id
      LEFT JOIN treinos_exercicios te ON te.treino_id = s.treino_id AND te.exercicio_id = s.exercicio_id
      WHERE s.usuario_id = $1 AND s.exercicio_id = $2
      ORDER BY s.data_treino DESC, s.treino_realizado_id, s.numero_serie;
    `, [usuarioId, exercicioId]);
    res.json(result.rows);
});

// Séries por grupo muscular de um período → { grupo: total_series }
async function seriesPorGrupo(usuarioId, inicioSql, fimSql, params = []) {
    const result = await db.query(`
        SELECT e.grupo_muscular, COUNT(su.id) AS total_series
        FROM series_usuario su
        JOIN exercicios e ON e.id = su.exercicio_id
        WHERE su.usuario_id = $1
          AND su.data_treino >= ${inicioSql}
          AND su.data_treino < ${fimSql}
        GROUP BY e.grupo_muscular
        ORDER BY total_series DESC
    `, [usuarioId, ...params]);

    const dados = {};
    result.rows.forEach(row => { dados[row.grupo_muscular] = parseInt(row.total_series); });
    return dados;
}

// Séries por grupo muscular na semana atual
router.get('/usuarios/:usuarioId/musculos-semana', requireVinculo('usuarioId'), async (req, res) => {
    res.json(await seriesPorGrupo(
        req.params.usuarioId,
        `DATE_TRUNC('week', ${SQL_HOJE})`,
        `DATE_TRUNC('week', ${SQL_HOJE}) + INTERVAL '1 week'`
    ));
});

// Séries por grupo muscular num mês (escala absoluta para radar chart)
router.get('/usuarios/:usuarioId/musculos-mes', requireVinculo('usuarioId'), async (req, res) => {
    const [anoAtual, mesAtual] = hojeSP().split('-').map(Number);
    const mes = parseInt(req.query.mes) || mesAtual;
    const ano = parseInt(req.query.ano) || anoAtual;
    if (mes < 1 || mes > 12 || ano < 2000 || ano > 2100) {
        return res.status(400).json({ error: 'Mês/ano inválidos.' });
    }
    const dataRef = `${ano}-${String(mes).padStart(2, '0')}-01`;
    res.json(await seriesPorGrupo(
        req.params.usuarioId,
        `DATE_TRUNC('month', $2::date)`,
        `DATE_TRUNC('month', $2::date) + INTERVAL '1 month'`,
        [dataRef]
    ));
});

module.exports = router;
