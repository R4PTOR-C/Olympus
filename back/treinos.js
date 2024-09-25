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

// Rota para adicionar exercícios a um treino
router.post('/treinos/:treinoId/exercicios', async (req, res) => {
    const { treinoId } = req.params; // ID do treino
    const { exercicio_id, series, repeticoes, carga, descanso } = req.body;

    try {
        // Inserir o exercício com os detalhes no treino
        await db.query(
            'INSERT INTO treinos_exercicios (treino_id, exercicio_id, series, repeticoes, carga, descanso) VALUES ($1, $2, $3, $4, $5, $6)',
            [treinoId, exercicio_id, series, repeticoes, carga, descanso]
        );

        res.status(201).json({ message: 'Exercício adicionado ao treino com sucesso' });
    } catch (error) {
        console.error('Erro ao adicionar exercício ao treino:', error);
        res.status(500).json({ error: 'Erro ao adicionar exercício ao treino' });
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
        // Recuperar todos os exercícios do treino
        const result = await db.query(
            `SELECT te.*, e.nome_exercicio 
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


module.exports = router;
