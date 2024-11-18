const express = require('express');
const db = require('./db');

const router = express.Router();

// Rota para listar todas as avaliações de um usuário
router.get('/usuarios/:usuarioId', async (req, res) => {
    const { usuarioId } = req.params;
    try {
        const { rows } = await db.query('SELECT * FROM avaliacoes_fisicas WHERE usuario_id = $1', [usuarioId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar avaliações físicas' });
    }
});

// Rota para criar uma nova avaliação
router.post('/', async (req, res) => {
    const { usuario_id, altura, peso, gordura_corporal, medicoes } = req.body; // Nome corrigido
    try {
        const { rows } = await db.query(
            'INSERT INTO avaliacoes_fisicas (usuario_id, altura, peso, gordura_corporal, medicoes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [usuario_id, altura, peso, gordura_corporal, medicoes]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar avaliação física' });
    }
});

// Rota para deletar uma avaliação
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rowCount } = await db.query('DELETE FROM avaliacoes_fisicas WHERE id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Avaliação física não encontrada' });
        }
        res.json({ message: 'Avaliação física deletada com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao deletar avaliação física' });
    }
});

module.exports = router;
