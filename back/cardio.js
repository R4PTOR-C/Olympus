const express = require('express');
const db = require('./db');
const router = express.Router();

// Lista sessões de um usuário (com join no nome do exercício)
router.get('/usuarios/:usuarioId', async (req, res) => {
    const { usuarioId } = req.params;
    const { inicio, fim } = req.query;
    try {
        let query = `
            SELECT cs.*, e.nome_exercicio, e.gif_url
            FROM cardio_sessoes cs
            JOIN exercicios e ON e.id = cs.exercicio_id
            WHERE cs.usuario_id = $1
        `;
        const params = [usuarioId];
        if (inicio && fim) {
            query += ' AND cs.data BETWEEN $2 AND $3';
            params.push(inicio, fim);
        }
        query += ' ORDER BY cs.data DESC, cs.created_at DESC';
        const { rows } = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar sessões de cardio' });
    }
});

// Cria uma sessão de cardio
router.post('/', async (req, res) => {
    const { usuario_id, exercicio_id, duracao_min, distancia_km, data } = req.body;
    try {
        const { rows } = await db.query(
            `INSERT INTO cardio_sessoes (usuario_id, exercicio_id, duracao_min, distancia_km, data)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [usuario_id, exercicio_id, duracao_min, distancia_km || null, data || new Date().toISOString().split('T')[0]]
        );

        const { processarEvento } = require('./gamificacao_engine');
        await processarEvento('cardio_registrado', usuario_id);

        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar sessão de cardio' });
    }
});

// Deleta uma sessão
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rowCount } = await db.query('DELETE FROM cardio_sessoes WHERE id = $1', [id]);
        if (rowCount === 0) return res.status(404).json({ error: 'Sessão não encontrada' });
        res.json({ message: 'Sessão deletada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao deletar sessão de cardio' });
    }
});

module.exports = router;
