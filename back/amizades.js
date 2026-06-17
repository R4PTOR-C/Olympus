// amizades.js — Conexões sociais (amizade simétrica entre usuários)
const express = require('express');
const db      = require('./db');
const { enviarPush } = require('./push');
const { authenticate, saoAmigos } = require('./middleware/auth');
const router  = express.Router();

// Helpers de autorização
const ehProprioUsuario = (req, id) => parseInt(req.user.userId) === parseInt(id);

async function carregarAmizade(id) {
    const { rows } = await db.query('SELECT * FROM amizades WHERE id = $1', [id]);
    return rows[0] || null;
}

function ehParticipante(req, amizade) {
    const uid = parseInt(req.user.userId);
    return uid === parseInt(amizade.solicitante_id) || uid === parseInt(amizade.destinatario_id);
}

// ─────────────────────────────────────────
// BUSCAR USUÁRIOS POR NOME (para adicionar)
// GET /amizades/buscar?q=
// ─────────────────────────────────────────
router.get('/buscar', authenticate, async (req, res) => {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json([]);
    try {
        const { rows } = await db.query(
            `SELECT u.id, u.nome, u.avatar, COALESCE(g.nivel, 1) AS nivel
             FROM usuarios u
             LEFT JOIN gamificacao_usuario g ON g.usuario_id = u.id
             WHERE u.nome ILIKE $1
               AND u.id <> $2
               AND u.id NOT IN (
                   SELECT CASE WHEN solicitante_id = $2 THEN destinatario_id ELSE solicitante_id END
                   FROM amizades
                   WHERE solicitante_id = $2 OR destinatario_id = $2
               )
             ORDER BY u.nome
             LIMIT 20`,
            [`%${q}%`, req.user.userId]
        );
        res.json(rows);
    } catch (err) {
        console.error('Erro ao buscar usuários:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// ─────────────────────────────────────────
// SUGESTÕES DE USUÁRIOS (descobrir pessoas)
// GET /amizades/sugestoes
// ─────────────────────────────────────────
router.get('/sugestoes', authenticate, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT u.id, u.nome, u.avatar, COALESCE(g.nivel, 1) AS nivel
             FROM usuarios u
             LEFT JOIN gamificacao_usuario g ON g.usuario_id = u.id
             WHERE u.id <> $1
               AND u.id NOT IN (
                   SELECT CASE WHEN solicitante_id = $1 THEN destinatario_id ELSE solicitante_id END
                   FROM amizades
                   WHERE solicitante_id = $1 OR destinatario_id = $1
               )
             ORDER BY RANDOM()
             LIMIT 12`,
            [req.user.userId]
        );
        res.json(rows);
    } catch (err) {
        console.error('Erro ao buscar sugestões:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// ─────────────────────────────────────────
// PEDIDOS PENDENTES RECEBIDOS
// GET /amizades/pendentes/:userId
// ─────────────────────────────────────────
router.get('/pendentes/:userId', authenticate, async (req, res) => {
    const { userId } = req.params;
    if (!ehProprioUsuario(req, userId)) return res.status(403).json({ error: 'Acesso não autorizado.' });
    try {
        const { rows } = await db.query(
            `SELECT a.id, a.solicitante_id, a.created_at,
                    u.nome AS solicitante_nome, u.avatar AS solicitante_avatar,
                    COALESCE(g.nivel, 1) AS nivel
             FROM amizades a
             JOIN usuarios u ON u.id = a.solicitante_id
             LEFT JOIN gamificacao_usuario g ON g.usuario_id = a.solicitante_id
             WHERE a.status = 'pendente' AND a.destinatario_id = $1
             ORDER BY a.created_at DESC`,
            [userId]
        );
        res.json(rows);
    } catch (err) {
        console.error('Erro ao buscar pendentes:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// ─────────────────────────────────────────
// TREINOS DE UM AMIGO
// GET /amizades/:amigoId/treinos
// ─────────────────────────────────────────
router.get('/:amigoId/treinos', authenticate, async (req, res) => {
    const { amigoId } = req.params;
    try {
        if (!ehProprioUsuario(req, amigoId) && !(await saoAmigos(req.user.userId, amigoId))) {
            return res.status(403).json({ error: 'Acesso não autorizado.' });
        }
        const { rows } = await db.query(
            'SELECT * FROM treinos WHERE usuario_id = $1 ORDER BY id',
            [amigoId]
        );
        res.json(rows);
    } catch (err) {
        console.error('Erro ao buscar treinos do amigo:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// ─────────────────────────────────────────
// LISTAR AMIGOS (aceitos)
// GET /amizades/:userId
// ─────────────────────────────────────────
router.get('/:userId', authenticate, async (req, res) => {
    const { userId } = req.params;
    if (!ehProprioUsuario(req, userId)) return res.status(403).json({ error: 'Acesso não autorizado.' });
    try {
        const { rows } = await db.query(
            `SELECT a.id AS amizade_id, u.id, u.nome, u.avatar, COALESCE(g.nivel, 1) AS nivel
             FROM amizades a
             JOIN usuarios u ON u.id = CASE WHEN a.solicitante_id = $1 THEN a.destinatario_id ELSE a.solicitante_id END
             LEFT JOIN gamificacao_usuario g ON g.usuario_id = u.id
             WHERE a.status = 'aceito' AND ($1 = a.solicitante_id OR $1 = a.destinatario_id)
             ORDER BY u.nome`,
            [userId]
        );
        res.json(rows);
    } catch (err) {
        console.error('Erro ao listar amigos:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// ─────────────────────────────────────────
// ENVIAR PEDIDO DE AMIZADE
// POST /amizades   body: { destinatario_id }
// ─────────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
    const solicitante_id = parseInt(req.user.userId);
    const destinatario_id = parseInt(req.body.destinatario_id);

    if (!destinatario_id) return res.status(400).json({ error: 'destinatario_id é obrigatório.' });
    if (destinatario_id === solicitante_id) return res.status(400).json({ error: 'Não é possível adicionar a si mesmo.' });

    try {
        // Já existe alguma relação (em qualquer direção)?
        const existente = await db.query(
            `SELECT * FROM amizades
             WHERE (solicitante_id = $1 AND destinatario_id = $2)
                OR (solicitante_id = $2 AND destinatario_id = $1)
             LIMIT 1`,
            [solicitante_id, destinatario_id]
        );
        if (existente.rows.length) {
            const a = existente.rows[0];
            if (a.status === 'aceito') return res.status(409).json({ error: 'Vocês já são amigos.' });
            return res.status(409).json({ error: 'Já existe um pedido pendente.' });
        }

        const { rows } = await db.query(
            `INSERT INTO amizades (solicitante_id, destinatario_id)
             VALUES ($1, $2) RETURNING *`,
            [solicitante_id, destinatario_id]
        );
        const amizade = rows[0];

        // Notifica o destinatário
        req.io?.to(`user_${destinatario_id}`).emit('atualizar_tela', { tipo: 'amizades' });
        const nomeRes = await db.query('SELECT nome FROM usuarios WHERE id = $1', [solicitante_id]);
        await enviarPush(destinatario_id, {
            title: 'Novo pedido de amizade',
            body: `${nomeRes.rows[0]?.nome || 'Alguém'} quer te adicionar.`,
            url: '/social',
        });

        res.status(201).json(amizade);
    } catch (err) {
        console.error('Erro ao criar amizade:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// ─────────────────────────────────────────
// ACEITAR PEDIDO
// PATCH /amizades/:id/aceitar
// ─────────────────────────────────────────
router.patch('/:id/aceitar', authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        const amizade = await carregarAmizade(id);
        if (!amizade) return res.status(404).json({ error: 'Pedido não encontrado.' });
        // Só o destinatário aceita
        if (!ehProprioUsuario(req, amizade.destinatario_id) || amizade.status !== 'pendente') {
            return res.status(403).json({ error: 'Acesso não autorizado.' });
        }

        const { rows } = await db.query(
            `UPDATE amizades SET status = 'aceito' WHERE id = $1 RETURNING *`,
            [id]
        );

        req.io?.to(`user_${amizade.solicitante_id}`).emit('atualizar_tela', { tipo: 'amizades' });
        const nomeRes = await db.query('SELECT nome FROM usuarios WHERE id = $1', [amizade.destinatario_id]);
        await enviarPush(amizade.solicitante_id, {
            title: 'Pedido de amizade aceito!',
            body: `${nomeRes.rows[0]?.nome || 'Alguém'} aceitou seu pedido.`,
            url: '/social',
        });

        res.json(rows[0]);
    } catch (err) {
        console.error('Erro ao aceitar amizade:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// ─────────────────────────────────────────
// RECUSAR PEDIDO (participante)
// PATCH /amizades/:id/recusar
// ─────────────────────────────────────────
router.patch('/:id/recusar', authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        const amizade = await carregarAmizade(id);
        if (!amizade) return res.status(404).json({ error: 'Pedido não encontrado.' });
        if (!ehParticipante(req, amizade)) return res.status(403).json({ error: 'Acesso não autorizado.' });

        await db.query('DELETE FROM amizades WHERE id = $1', [id]);
        req.io?.to(`user_${amizade.solicitante_id}`).emit('atualizar_tela', { tipo: 'amizades' });
        req.io?.to(`user_${amizade.destinatario_id}`).emit('atualizar_tela', { tipo: 'amizades' });
        res.json({ message: 'Pedido recusado.' });
    } catch (err) {
        console.error('Erro ao recusar amizade:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// ─────────────────────────────────────────
// REMOVER AMIZADE (participante)
// DELETE /amizades/:id
// ─────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        const amizade = await carregarAmizade(id);
        if (!amizade) return res.status(404).json({ error: 'Amizade não encontrada.' });
        if (!ehParticipante(req, amizade)) return res.status(403).json({ error: 'Acesso não autorizado.' });

        await db.query('DELETE FROM amizades WHERE id = $1', [id]);
        req.io?.to(`user_${amizade.solicitante_id}`).emit('atualizar_tela', { tipo: 'amizades' });
        req.io?.to(`user_${amizade.destinatario_id}`).emit('atualizar_tela', { tipo: 'amizades' });
        res.json({ message: 'Amizade removida.' });
    } catch (err) {
        console.error('Erro ao remover amizade:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

module.exports = router;
