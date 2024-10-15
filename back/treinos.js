const express = require('express');
const db = require('./db'); // Importa a configuração do banco de dados

const router = express.Router();

// Rota para criar um treino para um aluno
router.post('/usuarios/:usuarioId/treinos', async (req, res) => {
    const { usuarioId } = req.params; // ID do aluno
    const { nome_treino, descricao, dia_semana } = req.body;

    try {
        // Inserir o treino no banco de dados
        const result = await db.query(
            'INSERT INTO treinos (usuario_id, nome_treino, descricao, dia_semana) VALUES ($1, $2, $3, $4) RETURNING *',
            [usuarioId, nome_treino, descricao, dia_semana]
        );

        res.status(201).json(result.rows[0]); // Retorna o treino criado
    } catch (error) {
        console.error('Erro ao criar o treino:', error);
        res.status(500).json({ error: 'Erro ao criar o treino' });
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
            `SELECT te.exercicio_id, e.nome_exercicio
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

module.exports = router;
