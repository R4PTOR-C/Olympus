const express = require('express');
const db = require('./db'); // Importa a configuração do banco de dados

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
router.post('/usuarios/:usuarioId/treinos', async (req, res) => {
    const { usuarioId } = req.params;
    const { nome_treino, descricao, dia_semana, grupo_muscular } = req.body;

    // Mapeamento de grupos musculares para imagens
    const grupoParaImagem = {
        Peitoral: 'peito.png',
        Costas: 'costas.png',
        Ombros: 'ombros.png',
        Bíceps: 'biceps.png',
        Tríceps: 'triceps.png',
        Posterior: 'posterior.png',
        Frontal: 'frontal.png',
        Panturrilha: 'panturrilha.png',
        Abdômen: 'abdomen.png',
    };

    try {
        // Obter a imagem correspondente ou usar a padrão
        const imagemSelecionada = grupoParaImagem[grupo_muscular] || 'default.png';

        const result = await db.query(
            'INSERT INTO treinos (usuario_id, nome_treino, descricao, dia_semana, imagem) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [usuarioId, nome_treino, descricao, dia_semana, imagemSelecionada]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar o treino:', error);
        res.status(500).json({ error: 'Erro ao criar o treino' });
    }
});

router.put('/treinos/:treinoId', async (req, res) => {
    const { treinoId } = req.params;
    const { nome_treino, descricao, dia_semana } = req.body; // Removido grupo_muscular

    try {
        const result = await db.query(
            `UPDATE treinos
             SET nome_treino = $1, descricao = $2, dia_semana = $3
             WHERE id = $4
             RETURNING *`,
            [nome_treino, descricao, dia_semana, treinoId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Treino não encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar treino:', error);
        res.status(500).json({ error: 'Erro ao atualizar treino' });
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

        // Inserir cada exercício no treino
        for (const exercicio_id of exercicios) {
            await db.query(
                'INSERT INTO treinos_exercicios (treino_id, exercicio_id) VALUES ($1, $2)',
                [treinoId, exercicio_id]
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

// Rota para listar todos os treinos de um aluno
router.get('/usuarios/:usuarioId/treinos', async (req, res) => {
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
            `SELECT te.exercicio_id, e.nome_exercicio,e.grupo_muscular,  e.gif_url
             FROM treinos_exercicios te
             JOIN exercicios e ON te.exercicio_id = e.id
             WHERE te.treino_id = $1`,
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
router.delete('/treinos/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM treinos WHERE id = $1 RETURNING *', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Treino não encontrado' });
        }

        res.json({ message: 'Treino excluído com sucesso', treino: result.rows[0] });
    } catch (error) {
        console.error('Erro ao excluir treino:', error);
        res.status(500).json({ error: 'Erro ao excluir treino' });
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
    const { series, modo, treino_realizado_id } = req.body; // ✅ adiciona treino_realizado_id

    if (!Array.isArray(series)) {
        return res.status(400).json({ error: 'É necessário fornecer uma lista de séries.' });
    }

    try {
        await db.query('BEGIN');

        let dataTreino = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        if (modo !== 'novo_treino') {
            // Edição: apagar os registros do dia atual
            await db.query(
                `DELETE FROM series_usuario
                 WHERE usuario_id = $1 AND treino_id = $2 AND exercicio_id = $3 AND data_treino = $4`,
                [usuarioId, treinoId, exercicioId, dataTreino]
            );
        }

        for (const s of series) {
            const carga = s.carga === '' ? null : Number(s.carga);
            const repeticoes = s.repeticoes === '' ? null : Number(s.repeticoes);

            await db.query(
                `INSERT INTO series_usuario
                 (usuario_id, treino_id, exercicio_id, numero_serie, carga, repeticoes, data_treino, treino_realizado_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [usuarioId, treinoId, exercicioId, s.numero_serie, carga, repeticoes, dataTreino, treino_realizado_id]
            );
        }


        await db.query('COMMIT');
        res.status(201).json({ message: 'Séries registradas com sucesso.' });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Erro ao registrar séries:', error);
        res.status(500).json({ error: 'Erro ao registrar séries.' });
    }
});








router.get('/usuarios/:usuarioId/treinos/:treinoId/exercicios/:exercicioId/series', async (req, res) => {
    const { usuarioId, treinoId, exercicioId } = req.params;
    const { data } = req.query;

    try {
        let result;
        if (data) {
            result = await db.query(
                `SELECT numero_serie, carga, repeticoes, data_treino
             FROM series_usuario
             WHERE usuario_id = $1 AND treino_id = $2 AND exercicio_id = $3 AND data_treino = $4
             ORDER BY numero_serie`,
                [usuarioId, treinoId, exercicioId, data]
            );
        } else {
            // Busca a data mais recente
            result = await db.query(
                `SELECT numero_serie, carga, repeticoes, data_treino
             FROM series_usuario
             WHERE usuario_id = $1 AND treino_id = $2 AND exercicio_id = $3
             AND data_treino = (
                SELECT MAX(data_treino)
                FROM series_usuario
                WHERE usuario_id = $1 AND treino_id = $2 AND exercicio_id = $3
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

// Rota para verificar se existe treino finalizado hoje
router.get('/usuarios/:usuarioId/treinos/:treinoId/finalizados', async (req, res) => {
    const { usuarioId, treinoId } = req.params;
    const dataHoje = new Date().toISOString().split('T')[0];

    try {
        const result = await db.query(
            `SELECT id, data
             FROM treinos_realizados
             WHERE usuario_id = $1 AND treino_id = $2
               AND data = $3 AND finalizado_em IS NOT NULL
             LIMIT 1`,
            [usuarioId, treinoId, dataHoje]
        );

        if (result.rows.length > 0) {
            res.status(200).json(result.rows);
        } else {
            res.status(200).json([]); // Nenhum treino finalizado hoje
        }
    } catch (error) {
        console.error('Erro ao verificar treino finalizado:', error);
        res.status(500).json({ error: 'Erro ao verificar treino finalizado.' });
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
router.get('/usuarios/:usuarioId/exercicios_realizados', async (req, res) => {
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
router.get('/usuarios/:usuarioId/exercicios/:exercicioId/historico', async (req, res) => {
    const { usuarioId, exercicioId } = req.params;

    try {
        const result = await db.query(`
      SELECT
        s.data_treino,
        s.numero_serie,
        s.carga,
        s.repeticoes,
        t.nome_treino
      FROM series_usuario s
      JOIN treinos t ON t.id = s.treino_id
      WHERE s.usuario_id = $1 AND s.exercicio_id = $2
      ORDER BY s.data_treino DESC, s.numero_serie;
    `, [usuarioId, exercicioId]);

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar histórico do exercício:', error);
        res.status(500).json({ error: 'Erro ao buscar histórico do exercício.' });
    }
});




module.exports = router;
