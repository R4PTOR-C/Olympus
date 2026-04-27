const express = require('express');
const router  = express.Router();
const db      = require('./db');
const { calcNivel, getObjetivosComProgresso } = require('./gamificacao_engine');

router.get('/usuarios/:userId/progresso', async (req, res) => {
    const { userId } = req.params;
    try {
        const { rows: gRows } = await db.query(
            `SELECT xp_total, nivel, streak_atual, maior_streak, ultimo_treino_data
             FROM gamificacao_usuario WHERE usuario_id = $1`,
            [userId]
        );
        const g = gRows[0] || { xp_total: 0, nivel: 1, streak_atual: 0, maior_streak: 0 };

        const objetivos  = await getObjetivosComProgresso(userId);
        const nivelInfo  = calcNivel(g.xp_total);

        res.json({
            xp_total:        g.xp_total,
            streak_atual:    g.streak_atual,
            maior_streak:    g.maior_streak,
            nivel:           nivelInfo.nivel,
            nivel_nome:      nivelInfo.nome,
            xp_no_nivel:     nivelInfo.xpNoNivel,
            xp_para_proximo: nivelInfo.xpParaProximo,
            pct_nivel:       nivelInfo.pct,
            objetivos,
        });
    } catch (err) {
        console.error('Erro ao buscar progresso:', err);
        res.status(500).json({ error: 'Erro ao buscar progresso.' });
    }
});

module.exports = router;
module.exports.calcNivel = calcNivel;
