const express = require('express');
const db = require('./db');
const { enviarPush } = require('./push');
const { authenticate, requireVinculo, verificarVinculo } = require('./middleware/auth');

const router = express.Router();

// Rota para obeter informação de treino
router.get('/treinos/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('SELECT * FROM treinos WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Treino não encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar treino pelo ID:', error);
        res.status(500).json({ error: 'Erro ao buscar treino pelo ID' });
    }
});

// Rota para criar um treino para um aluno
router.post('/usuarios/:usuarioId/treinos', authenticate, requireVinculo('usuarioId'), async (req, res) => {
    const { usuarioId } = req.params;
    const { nome_treino, descricao, dia_semana, grupo_muscular, grupos_auxiliares } = req.body;

    const grupoParaImagem = {
        Peitoral: 'peito.png',
        Costas: 'costas.png',
        Ombros: 'ombros.png',
        Bíceps: 'biceps.png',
        Tríceps: 'triceps.png',
        Pernas: 'perna.png',
        Panturrilha: 'panturrilha.png',
        Abdômen: 'abdomen.png',
    };

    try {
        const imagemSelecionada = grupoParaImagem[grupo_muscular] || 'default.png';
        const auxiliares = Array.isArray(grupos_auxiliares) ? grupos_auxiliares : [];

        const result = await db.query(
            `INSERT INTO treinos (usuario_id, nome_treino, descricao, dia_semana, grupo_muscular, imagem, grupos_auxiliares)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [usuarioId, nome_treino, descricao, dia_semana, grupo_muscular, imagemSelecionada, auxiliares]
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
    } catch (error) {
        console.error('Erro ao criar o treino:', error);
        res.status(500).json({ error: 'Erro ao criar o treino' });
    }
});

router.put('/treinos/:treinoId', authenticate, async (req, res) => {
    const { treinoId } = req.params;
    const { nome_treino, descricao, dia_semana, grupo_muscular, grupos_auxiliares } = req.body;

    const grupoParaImagem = {
        Peitoral: 'peito.png', Costas: 'costas.png', Ombros: 'ombros.png',
        Bíceps: 'biceps.png', Tríceps: 'triceps.png', Pernas: 'perna.png',
        Panturrilha: 'panturrilha.png', Abdômen: 'abdomen.png',
    };

    try {
        // verificar vínculo antes de atualizar
        const dono = await db.query('SELECT usuario_id FROM treinos WHERE id = $1', [treinoId]);
        if (!dono.rows.length) return res.status(404).json({ error: 'Treino não encontrado' });
        if (!await verificarVinculo(req, dono.rows[0].usuario_id))
            return res.status(403).json({ error: 'Acesso não autorizado.' });

        const imagemSelecionada = grupoParaImagem[grupo_muscular] || 'default.png';
        const auxiliares = Array.isArray(grupos_auxiliares) ? grupos_auxiliares : [];

        const result = await db.query(
            `UPDATE treinos
             SET nome_treino = $1, descricao = $2, dia_semana = $3, grupo_muscular = $4,
                 imagem = $5, grupos_auxiliares = $6
             WHERE id = $7
             RETURNING *`,
            [nome_treino, descricao, dia_semana, grupo_muscular, imagemSelecionada, auxiliares, treinoId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Treino não encontrado' });
        }

        const treino = result.rows[0];
        req.io?.to(`user_${treino.usuario_id}`).emit('atualizar_tela', { tipo: 'treinos' });
        await enviarPush(treino.usuario_id, {
            title: 'Treino atualizado',
            body: treino.nome_treino,
            url: `/usuarios/view/${treino.usuario_id}`
        });
        res.json(treino);
    } catch (error) {
        console.error('Erro ao atualizar treino:', error);
        res.status(500).json({ error: 'Erro ao atualizar treino' });
    }
});

// atualizar so dia da semana
router.patch('/:treinoId/dia', async (req, res) => {
    const { treinoId } = req.params;
    const { dia_semana } = req.body;

    try {
        const result = await db.query(
            `UPDATE treinos
       SET dia_semana = $1
       WHERE id = $2
       RETURNING *`,
            [dia_semana, treinoId]
        );

        if (result.rowCount === 0) return res.status(404).json({ error: 'Treino não encontrado' });

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar dia_semana:', error);
        res.status(500).json({ error: 'Erro ao atualizar dia_semana' });
    }
});

// PATCH genérico - atualiza apenas os campos enviados
router.patch('/treinos/:treinoId', authenticate, async (req, res) => {
    const { treinoId } = req.params;
    const campos = req.body;

    // impede update vazio
    if (!campos || Object.keys(campos).length === 0) {
        return res.status(400).json({ error: 'Nenhum campo enviado para atualização.' });
    }

    try {
        const dono = await db.query('SELECT usuario_id FROM treinos WHERE id = $1', [treinoId]);
        if (!dono.rows.length) return res.status(404).json({ error: 'Treino não encontrado' });
        if (!await verificarVinculo(req, dono.rows[0].usuario_id))
            return res.status(403).json({ error: 'Acesso não autorizado.' });
        // monta dinamicamente o SET do SQL
        const colunas = Object.keys(campos)
            .map((col, idx) => `${col} = $${idx + 1}`)
            .join(', ');

        const valores = Object.values(campos);

        const result = await db.query(
            `UPDATE treinos SET ${colunas} WHERE id = $${valores.length + 1} RETURNING *`,
            [...valores, treinoId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Treino não encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar treino parcialmente:', error);
        res.status(500).json({ error: 'Erro ao atualizar treino parcialmente' });
    }
});

// 🔄 Adicione esta rota no seu arquivo treinos.js (antes do module.exports)

// Rota para fazer swap (troca) de treinos entre dias
router.patch('/swap', async (req, res) => {
    const { treino1_id, treino2_id, dia1, dia2 } = req.body;

    if (!treino1_id || !treino2_id || !dia1 || !dia2) {
        return res.status(400).json({
            error: 'Parâmetros obrigatórios: treino1_id, treino2_id, dia1, dia2'
        });
    }

    try {
        await db.query('BEGIN');

        await db.query(
            'UPDATE treinos SET dia_semana = $1 WHERE id = $2',
            ['__TEMP_SWAP__', treino1_id]
        );

        await db.query(
            'UPDATE treinos SET dia_semana = $1 WHERE id = $2',
            [dia1, treino2_id]
        );

        await db.query(
            'UPDATE treinos SET dia_semana = $1 WHERE id = $2',
            [dia2, treino1_id]
        );

        await db.query('COMMIT');

        res.json({
            success: true,
            message: 'Treinos trocados com sucesso'
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Erro ao fazer swap de treinos:', error);
        res.status(500).json({
            error: 'Erro ao trocar treinos de lugar',
            details: error.message
        });
    }
});





// Rota para adicionar múltiplos exercícios a um treino
router.post('/treinos/:treinoId/exercicios', async (req, res) => {
    const { treinoId } = req.params; // ID do treino
    const { exercicios } = req.body; // Espera um array de exercicio_id

    if (!Array.isArray(exercicios) || exercicios.length === 0) {
        return res.status(400).json({ error: 'É necessário fornecer uma lista de exercícios.' });
    }

    try {
        // Iniciar transação para garantir que todos os exercícios sejam inseridos
        await db.query('BEGIN');

        // Aceita tanto array de IDs quanto array de objetos { id, series_alvo, reps_alvo }
        for (let i = 0; i < exercicios.length; i++) {
            const item = exercicios[i];
            const exercicio_id = typeof item === 'object' ? item.id : item;
            const series_alvo = typeof item === 'object' ? (item.series_alvo || null) : null;
            const reps_alvo = typeof item === 'object' ? (item.reps_alvo || null) : null;
            const ordemAtual = await db.query(
                'SELECT COUNT(*) FROM treinos_exercicios WHERE treino_id = $1',
                [treinoId]
            );
            const ordem = parseInt(ordemAtual.rows[0].count);
            await db.query(
                'INSERT INTO treinos_exercicios (treino_id, exercicio_id, series_alvo, reps_alvo, ordem) VALUES ($1, $2, $3, $4, $5)',
                [treinoId, exercicio_id, series_alvo, reps_alvo, ordem]
            );
        }

        await db.query('COMMIT'); // Confirma a transação
        res.status(201).json({ message: 'Exercícios adicionados ao treino com sucesso' });
    } catch (error) {
        await db.query('ROLLBACK'); // Desfaz a transação em caso de erro
        console.error('Erro ao adicionar exercícios ao treino:', error);
        res.status(500).json({ error: 'Erro ao adicionar exercícios ao treino' });
    }
});

// Rota para salvar a ordem dos exercícios de um treino
router.put('/treinos/:treinoId/exercicios/ordem', async (req, res) => {
    const { treinoId } = req.params;
    const { ordem } = req.body; // array de exercicio_id na nova ordem

    if (!Array.isArray(ordem) || ordem.length === 0) {
        return res.status(400).json({ error: 'ordem deve ser um array de exercicio_id' });
    }

    try {
        await db.query('BEGIN');
        for (let i = 0; i < ordem.length; i++) {
            await db.query(
                'UPDATE treinos_exercicios SET ordem = $1 WHERE treino_id = $2 AND exercicio_id = $3',
                [i, treinoId, ordem[i]]
            );
        }
        await db.query('COMMIT');
        res.json({ ok: true });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Erro ao salvar ordem:', error);
        res.status(500).json({ error: 'Erro ao salvar ordem dos exercícios' });
    }
});

// Rota para listar todos os treinos de um aluno
router.get('/usuarios/:usuarioId/treinos', authenticate, requireVinculo('usuarioId'), async (req, res) => {
    const { usuarioId } = req.params;

    try {
        const result = await db.query(
            'SELECT * FROM treinos WHERE usuario_id = $1',
            [usuarioId]
        );

        res.json(result.rows); // Retorna a lista de treinos
    } catch (error) {
        console.error('Erro ao buscar treinos:', error);
        res.status(500).json({ error: 'Erro ao buscar os treinos' });
    }
});

// Rota para listar todos os exercícios de um treino específico
router.get('/treinos/:treinoId/exercicios', async (req, res) => {
    const { treinoId } = req.params;

    try {
        // Verificar se o treino existe
        const treinoExiste = await db.query('SELECT * FROM treinos WHERE id = $1', [treinoId]);
        if (treinoExiste.rowCount === 0) {
            return res.status(404).json({ error: 'Treino não encontrado' });
        }

        // Recuperar todos os exercícios do treino
        const result = await db.query(
            `SELECT te.exercicio_id, e.nome_exercicio, e.grupo_muscular, e.gif_url,
                    te.series_alvo, te.reps_alvo
             FROM treinos_exercicios te
             JOIN exercicios e ON te.exercicio_id = e.id
             WHERE te.treino_id = $1
             ORDER BY te.ordem ASC`,
            [treinoId]
        );

        res.json(result.rows); // Retorna a lista de exercícios
    } catch (error) {
        console.error('Erro ao buscar exercícios do treino:', error);
        res.status(500).json({ error: 'Erro ao buscar os exercícios do treino' });
    }
});


// Rota para listar todos os exercícios
router.get('/exercicios', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT id, nome_exercicio FROM exercicios');
        res.json(rows);
    } catch (error) {
        console.error('Erro ao listar exercícios:', error);
        res.status(500).json({ error: 'Erro ao listar exercícios' });
    }
});

// Rota para obter grupos musculares únicos
router.get('/exercicios/grupos', async (req, res) => {
    try {
        const result = await db.query('SELECT DISTINCT grupo_muscular FROM exercicios');
        res.json(result.rows.map(row => row.grupo_muscular)); // Retorna apenas os nomes dos grupos musculares
    } catch (error) {
        console.error('Erro ao buscar grupos musculares:', error);
        res.status(500).json({ error: 'Erro ao buscar grupos musculares' });
    }
});

router.get('/grupos', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT DISTINCT grupo_muscular FROM exercicios WHERE grupo_muscular IS NOT NULL');
        const grupos = rows.map(row => row.grupo_muscular);
        res.json(grupos); // Retorna uma lista de grupos musculares
    } catch (err) {
        console.error('Erro ao buscar grupos musculares:', err);
        res.status(500).json({ error: 'Erro ao buscar grupos musculares' });
    }
});



// Rota para deletar um treino
router.delete('/treinos/:id', authenticate, async (req, res) => {
    const { id } = req.params;

    try {
        const dono = await db.query('SELECT usuario_id FROM treinos WHERE id = $1', [id]);
        if (!dono.rows.length) return res.status(404).json({ error: 'Treino não encontrado' });
        if (!await verificarVinculo(req, dono.rows[0].usuario_id))
            return res.status(403).json({ error: 'Acesso não autorizado.' });

        const result = await db.query('DELETE FROM treinos WHERE id = $1 RETURNING *', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Treino não encontrado' });
        }

        const usuarioId = result.rows[0].usuario_id;
        req.io?.to(`user_${usuarioId}`).emit('atualizar_tela', { tipo: 'treinos' });
        res.json({ message: 'Treino excluído com sucesso', treino: result.rows[0] });
    } catch (error) {
        console.error('Erro ao excluir treino:', error);
        res.status(500).json({ error: 'Erro ao excluir treino' });
    }
});

router.patch('/treinos/:treinoId/exercicios/:exercicioId', async (req, res) => {
    const { treinoId, exercicioId } = req.params;
    const { series_alvo, reps_alvo } = req.body;

    try {
        const result = await db.query(
            `UPDATE treinos_exercicios
             SET series_alvo = $1, reps_alvo = $2
             WHERE treino_id = $3 AND exercicio_id = $4
             RETURNING *`,
            [series_alvo ?? null, reps_alvo ?? null, treinoId, exercicioId]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Exercício não encontrado no treino.' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar meta do exercício:', error);
        res.status(500).json({ error: 'Erro ao atualizar meta do exercício.' });
    }
});

router.delete('/treinos/:treinoId/exercicios/:exercicioId', async (req, res) => {
    const { treinoId, exercicioId } = req.params;

    try {
        const result = await db.query(
            'DELETE FROM treinos_exercicios WHERE treino_id = $1 AND exercicio_id = $2 RETURNING *',
            [treinoId, exercicioId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Exercício não encontrado no treino.' });
        }

        res.status(200).json({ message: 'Exercício removido com sucesso.', exercicio: result.rows[0] });
    } catch (error) {
        console.error('Erro ao remover exercício do treino:', error);
        res.status(500).json({ error: 'Erro ao remover exercício do treino.' });
    }
});


router.post('/usuarios/:usuarioId/treinos/:treinoId/exercicios/:exercicioId/series', async (req, res) => {
    const { usuarioId, treinoId, exercicioId } = req.params;
    const { series, modo, treino_realizado_id } = req.body;

    if (!Array.isArray(series)) {
        return res.status(400).json({ error: 'É necessário fornecer uma lista de séries.' });
    }

    try {
        await db.query('BEGIN');

        const dataTreino = new Date().toISOString().split('T')[0];

        // Remove todas as séries existentes desta sessão para este exercício,
        // garantindo que séries deletadas pelo usuário não permaneçam no banco
        if (treino_realizado_id) {
            await db.query(`
                DELETE FROM series_usuario
                WHERE usuario_id = $1 AND treino_id = $2 AND exercicio_id = $3
                  AND treino_realizado_id = $4
            `, [usuarioId, treinoId, exercicioId, treino_realizado_id]);
        }

        for (const s of series) {
            const carga      = s.carga      === '' ? null : Number(s.carga);
            const repeticoes = s.repeticoes === '' ? null : Number(s.repeticoes);

            await db.query(`
                INSERT INTO series_usuario
                (usuario_id, treino_id, exercicio_id, numero_serie, carga, repeticoes, data_treino, treino_realizado_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [usuarioId, treinoId, exercicioId, s.numero_serie, carga, repeticoes, dataTreino, treino_realizado_id]);
        }

        await db.query('COMMIT');
        res.status(201).json({ message: 'Séries registradas ou atualizadas com sucesso.' });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Erro ao registrar séries:', error);
        res.status(500).json({ error: 'Erro ao registrar séries.' });
    }
});









router.get('/usuarios/:usuarioId/treinos/:treinoId/exercicios/:exercicioId/series', async (req, res) => {
    const { usuarioId, treinoId, exercicioId } = req.params;
    const { data, treino_realizado_id } = req.query;

    try {
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
    } catch (error) {
        console.error('Erro ao buscar séries do exercício:', error);
        res.status(500).json({ error: 'Erro ao buscar séries do exercício.' });
    }
});

router.post('/usuarios/:usuarioId/treinos/:treinoId/iniciar', async (req, res) => {
    const { usuarioId, treinoId } = req.params;
    const dataHoje = new Date().toISOString().split('T')[0];

    try {
        // Finaliza qualquer treino em aberto de dias anteriores
        await db.query(
            `UPDATE treinos_realizados
             SET finalizado_em = NOW()
             WHERE usuario_id = $1 AND finalizado_em IS NULL AND data::date < CURRENT_DATE`,
            [usuarioId]
        );

        // Verifica se já existe um treino em andamento
        const { rows } = await db.query(
            `SELECT * FROM treinos_realizados
             WHERE usuario_id = $1 AND treino_id = $2 AND data = $3 AND finalizado_em IS NULL`,
            [usuarioId, treinoId, dataHoje]
        );

        if (rows.length > 0) {
            return res.status(200).json({ treinoRealizado: rows[0], existente: true });
        }

        // Cria novo treino
        const insert = await db.query(
            `INSERT INTO treinos_realizados (usuario_id, treino_id, data)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [usuarioId, treinoId, dataHoje]
        );

        res.status(201).json({ treinoRealizado: insert.rows[0], existente: false });
    } catch (error) {
        console.error('Erro ao iniciar treino:', error);
        res.status(500).json({ error: 'Erro ao iniciar treino.' });
    }
});

router.post('/treinos_realizados/:id/reabrir', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(
            `UPDATE treinos_realizados SET finalizado_em = NULL WHERE id = $1`,
            [id]
        );
        res.status(200).json({ message: 'Treino reaberto.' });
    } catch (error) {
        console.error('Erro ao reabrir treino:', error);
        res.status(500).json({ error: 'Erro ao reabrir treino.' });
    }
});

router.post('/treinos_realizados/:id/finalizar', async (req, res) => {
    const { id } = req.params;

    try {
        await db.query(
            `UPDATE treinos_realizados
             SET finalizado_em = NOW()
             WHERE id = $1`,
            [id]
        );

        res.status(200).json({ message: 'Treino finalizado com sucesso.' });
    } catch (error) {
        console.error('Erro ao finalizar treino:', error);
        res.status(500).json({ error: 'Erro ao finalizar treino.' });
    }
});

// ── OBSERVAÇÕES POR EXERCÍCIO ──────────────────────────────────────────────

router.get('/treinos_realizados/:treinoRealizadoId/obs', async (req, res) => {
    const { treinoRealizadoId } = req.params;
    try {
        const { rows } = await db.query(
            `SELECT exercicio_id, observacao FROM obs_exercicio WHERE treino_realizado_id = $1`,
            [treinoRealizadoId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar observações:', error);
        res.status(500).json({ error: 'Erro ao buscar observações.' });
    }
});

router.post('/treinos_realizados/:treinoRealizadoId/exercicios/:exercicioId/obs', async (req, res) => {
    const { treinoRealizadoId, exercicioId } = req.params;
    const { observacao } = req.body;
    try {
        await db.query(
            `INSERT INTO obs_exercicio (treino_realizado_id, exercicio_id, observacao)
             VALUES ($1, $2, $3)
             ON CONFLICT (treino_realizado_id, exercicio_id)
             DO UPDATE SET observacao = EXCLUDED.observacao, updated_at = NOW()`,
            [treinoRealizadoId, exercicioId, observacao]
        );
        res.json({ ok: true });
    } catch (error) {
        console.error('Erro ao salvar observação:', error);
        res.status(500).json({ error: 'Erro ao salvar observação.' });
    }
});

router.get('/usuarios/:usuarioId/treino-ativo', async (req, res) => {
    const { usuarioId } = req.params;
    try {
        const { rows } = await db.query(
            `SELECT tr.id AS treino_realizado_id, tr.treino_id, tr.data,
                    t.nome_treino, t.imagem, t.grupo_muscular, t.dia_semana
             FROM treinos_realizados tr
             JOIN treinos t ON t.id = tr.treino_id
             WHERE tr.usuario_id = $1 AND tr.finalizado_em IS NULL AND tr.data::date = CURRENT_DATE
             ORDER BY tr.data DESC
             LIMIT 1`,
            [usuarioId]
        );
        if (rows.length > 0) {
            const days = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];
            const todayName = days[new Date().getDay()];
            return res.json({ ativo: true, isToday: rows[0].dia_semana === todayName, ...rows[0] });
        }
        return res.json({ ativo: false });
    } catch (error) {
        console.error('Erro ao buscar treino ativo:', error);
        res.status(500).json({ error: 'Erro ao buscar treino ativo.' });
    }
});

router.get('/usuarios/:usuarioId/treinos/:treinoId/ativo', async (req, res) => {
    const { usuarioId, treinoId } = req.params;
    const dataHoje = new Date().toISOString().split('T')[0];

    try {
        const { rows } = await db.query(
            `SELECT * FROM treinos_realizados
             WHERE usuario_id = $1 AND treino_id = $2 AND data = $3 AND finalizado_em IS NULL
             LIMIT 1`,
            [usuarioId, treinoId, dataHoje]
        );

        if (rows.length > 0) {
            // Há um treino ativo
            return res.status(200).json({ ativo: true, treinoRealizadoId: rows[0].id });
        } else {
            // Nenhum treino ativo encontrado
            return res.status(200).json({ ativo: false });
        }
    } catch (error) {
        console.error('Erro ao verificar treino ativo:', error);
        res.status(500).json({ error: 'Erro ao verificar treino ativo.' });
    }
});

// Rota para buscar treinos finalizados com séries registradas
router.get('/usuarios/:usuarioId/treinos/:treinoId/finalizados', async (req, res) => {
    const { usuarioId, treinoId } = req.params;

    try {
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
    } catch (error) {
        console.error('Erro ao buscar treinos finalizados com séries:', error);
        res.status(500).json({ error: 'Erro ao buscar treinos finalizados com séries.' });
    }
});



// Rota para listar todos os treinos realizados por um usuário em um treino específico
router.get('/treinos_realizados', async (req, res) => {
    const { usuario_id, treino_id } = req.query;

    if (!usuario_id || !treino_id) {
        return res.status(400).json({ error: 'Parâmetros usuario_id e treino_id são obrigatórios.' });
    }

    try {
        const result = await db.query(
            `SELECT *
             FROM treinos_realizados
             WHERE usuario_id = $1 AND treino_id = $2
             ORDER BY data DESC`,
            [usuario_id, treino_id]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar treinos realizados:', error);
        res.status(500).json({ error: 'Erro ao buscar treinos realizados.' });
    }
});

// GET /usuarios/:usuarioId/exercicios_realizados
router.get('/usuarios/:usuarioId/exercicios_realizados', authenticate, requireVinculo('usuarioId'), async (req, res) => {
    const { usuarioId } = req.params;

    try {
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
    `, [usuarioId]);

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar exercícios realizados:', error);
        res.status(500).json({ error: 'Erro ao buscar exercícios realizados.' });
    }
});

// GET /usuarios/:usuarioId/exercicios/:exercicioId/historico
router.get('/usuarios/:usuarioId/exercicios/:exercicioId/historico', authenticate, requireVinculo('usuarioId'), async (req, res) => {
    const { usuarioId, exercicioId } = req.params;

    try {
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
    } catch (error) {
        console.error('Erro ao buscar histórico do exercício:', error);
        res.status(500).json({ error: 'Erro ao buscar histórico do exercício.' });
    }
});




// Séries por grupo muscular no mês atual (escala absoluta para radar chart)
router.get('/usuarios/:usuarioId/musculos-semana', authenticate, async (req, res) => {
    const { usuarioId } = req.params;
    try {
        const result = await db.query(`
            SELECT e.grupo_muscular, COUNT(su.id) AS total_series
            FROM series_usuario su
            JOIN exercicios e ON e.id = su.exercicio_id
            WHERE su.usuario_id = $1
              AND su.data_treino >= DATE_TRUNC('week', CURRENT_DATE)
              AND su.data_treino < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
            GROUP BY e.grupo_muscular
            ORDER BY total_series DESC
        `, [usuarioId]);

        const dados = {};
        result.rows.forEach(row => {
            dados[row.grupo_muscular] = parseInt(row.total_series);
        });

        res.json(dados);
    } catch (error) {
        console.error('Erro ao buscar músculos da semana:', error);
        res.status(500).json({ error: 'Erro ao buscar dados musculares.' });
    }
});

router.get('/usuarios/:usuarioId/musculos-mes', authenticate, async (req, res) => {
    const { usuarioId } = req.params;
    const mes = parseInt(req.query.mes) || new Date().getMonth() + 1;
    const ano = parseInt(req.query.ano) || new Date().getFullYear();
    const dataRef = `${ano}-${String(mes).padStart(2, '0')}-01`;
    try {
        const result = await db.query(`
            SELECT e.grupo_muscular, COUNT(su.id) AS total_series
            FROM series_usuario su
            JOIN exercicios e ON e.id = su.exercicio_id
            WHERE su.usuario_id = $1
              AND su.data_treino >= DATE_TRUNC('month', $2::date)
              AND su.data_treino < DATE_TRUNC('month', $2::date) + INTERVAL '1 month'
            GROUP BY e.grupo_muscular
            ORDER BY total_series DESC
        `, [usuarioId, dataRef]);

        const dados = {};
        result.rows.forEach(row => {
            dados[row.grupo_muscular] = parseInt(row.total_series);
        });

        res.json(dados);
    } catch (error) {
        console.error('Erro ao buscar músculos do mês:', error);
        res.status(500).json({ error: 'Erro ao buscar dados musculares.' });
    }
});

module.exports = router;
