const express = require('express');
const db      = require('./db');
const router  = express.Router();

const calcularMeta = (peso) => Math.round((peso * 35) / 50) * 50;

// GET /agua/usuarios/:userId/hoje
// Retorna total consumido hoje, meta e lista de registros
router.get('/usuarios/:userId/hoje', async (req, res) => {
    const { userId } = req.params;
    const hoje = new Date().toISOString().split('T')[0];
    try {
        const [registrosRes, usuarioRes] = await Promise.all([
            db.query(
                `SELECT id, ml, created_at
                 FROM agua_registros
                 WHERE usuario_id = $1 AND created_at::date = $2
                 ORDER BY created_at ASC`,
                [userId, hoje]
            ),
            db.query(
                `SELECT meta_agua_ml, peso FROM usuarios WHERE id = $1`,
                [userId]
            ),
        ]);

        const usuario  = usuarioRes.rows[0] || {};
        const meta     = usuario.meta_agua_ml || (usuario.peso ? calcularMeta(parseFloat(usuario.peso)) : 2500);
        const total    = registrosRes.rows.reduce((sum, r) => sum + r.ml, 0);

        res.json({ total, meta, registros: registrosRes.rows });
    } catch (err) {
        console.error('Erro ao buscar hidratação:', err);
        res.status(500).json({ error: 'Erro ao buscar hidratação.' });
    }
});

// POST /agua/usuarios/:userId
// Adiciona um registro de consumo
router.post('/usuarios/:userId', async (req, res) => {
    const { userId } = req.params;
    const { ml } = req.body;
    if (!ml || ml <= 0) return res.status(400).json({ error: 'ml inválido.' });
    try {
        const { rows } = await db.query(
            `INSERT INTO agua_registros (usuario_id, ml) VALUES ($1, $2) RETURNING *`,
            [userId, ml]
        );

        const { processarEvento } = require('./gamificacao_engine');
        const gamResult = await processarEvento('agua_adicionada', userId);

        res.status(201).json({ ...rows[0], xp_ganho: gamResult.xp_ganho, completados: gamResult.completados });
    } catch (err) {
        console.error('Erro ao registrar água:', err);
        res.status(500).json({ error: 'Erro ao registrar água.' });
    }
});

// DELETE /agua/registros/:id
// Remove um registro (desfazer)
router.delete('/registros/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(`DELETE FROM agua_registros WHERE id = $1`, [id]);
        res.json({ ok: true });
    } catch (err) {
        console.error('Erro ao remover registro:', err);
        res.status(500).json({ error: 'Erro ao remover registro.' });
    }
});

// PUT /agua/usuarios/:userId/meta
// Atualiza a meta diária do usuário
router.put('/usuarios/:userId/meta', async (req, res) => {
    const { userId } = req.params;
    const { meta_agua_ml } = req.body;
    if (!meta_agua_ml || meta_agua_ml < 500 || meta_agua_ml > 6000)
        return res.status(400).json({ error: 'Meta inválida.' });
    try {
        await db.query(
            `UPDATE usuarios SET meta_agua_ml = $1 WHERE id = $2`,
            [meta_agua_ml, userId]
        );
        res.json({ ok: true, meta_agua_ml });
    } catch (err) {
        console.error('Erro ao atualizar meta:', err);
        res.status(500).json({ error: 'Erro ao atualizar meta.' });
    }
});

module.exports = router;
