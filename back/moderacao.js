// moderacao.js — Denúncias e bloqueios.
//
// Exigidos pela Google Play: apps com conteúdo gerado por usuários (chat,
// rede social) precisam deixar o usuário denunciar e bloquear outros, e apps
// com IA generativa (Hércules) precisam deixar denunciar respostas ofensivas.
// Tabelas: back/scripts/moderacao.sql

const express   = require('express');
const rateLimit = require('express-rate-limit');
const db        = require('./db');
const { enviarEmail, configurado: emailConfigurado } = require('./config/email');
const { authenticate, requireAdmin, existeBloqueio } = require('./middleware/auth');

const router = express.Router();
router.use(authenticate);

const TIPOS   = ['usuario', 'mensagem', 'hercules'];
const MOTIVOS = [
    'spam',
    'assedio',           // assédio, ofensa ou discurso de ódio
    'conteudo_sexual',
    'violencia',         // violência ou ameaça
    'golpe',             // golpe ou fraude
    'conselho_perigoso', // orientação perigosa à saúde (Hércules)
    'outro',
];
const MAX_TEXTO = 4000;

// Evita enxurrada de denúncias de uma conta só
const limitarDenuncias = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 20,
    keyGenerator: (req) => String(req.user.userId),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Muitas denúncias em pouco tempo. Tente mais tarde.' },
});

// Bloqueia `alvoId` para `usuarioId` e desfaz o que liga os dois:
// amizade (qualquer status), vínculo professor ↔ aluno e chat (arquivado).
async function bloquear(usuarioId, alvoId) {
    await db.transaction(async (tx) => {
        await tx.query(
            `INSERT INTO bloqueios (bloqueador_id, bloqueado_id) VALUES ($1, $2)
             ON CONFLICT (bloqueador_id, bloqueado_id) DO NOTHING`,
            [usuarioId, alvoId]
        );
        await tx.query(
            `DELETE FROM amizades
             WHERE (solicitante_id = $1 AND destinatario_id = $2)
                OR (solicitante_id = $2 AND destinatario_id = $1)`,
            [usuarioId, alvoId]
        );
        await tx.query(
            `UPDATE vinculos SET status = 'encerrado'
             WHERE status IN ('ativo', 'pendente')
               AND ((professor_id = $1 AND aluno_id = $2) OR (professor_id = $2 AND aluno_id = $1))`,
            [usuarioId, alvoId]
        );
        await tx.query(
            `UPDATE chats SET arquivado = TRUE
             WHERE (usuario1_id = $1 AND usuario2_id = $2)
                OR (usuario1_id = $2 AND usuario2_id = $1)`,
            [usuarioId, alvoId]
        );
    });
}

const usuarioExiste = async (id) =>
    (await db.query('SELECT 1 FROM usuarios WHERE id = $1', [id])).rows.length > 0;

// Avisa a moderação por e-mail (opcional: falha não impede a denúncia)
async function notificarModeracao(denuncia) {
    const destino = process.env.MODERACAO_EMAIL || process.env.EMAIL_USER;
    if (!destino || !emailConfigurado()) return;
    try {
        await enviarEmail({
            to: destino,
            subject: `[Atlanteon] Nova denúncia #${denuncia.id} (${denuncia.tipo} · ${denuncia.motivo})`,
            text: [
                `Denúncia #${denuncia.id}`,
                `Tipo: ${denuncia.tipo}`,
                `Motivo: ${denuncia.motivo}`,
                `Denunciante: usuário ${denuncia.denunciante_id}`,
                `Denunciado: ${denuncia.denunciado_id ? `usuário ${denuncia.denunciado_id}` : '—'}`,
                `Detalhes: ${denuncia.detalhes || '—'}`,
                '',
                'Conteúdo denunciado:',
                denuncia.conteudo || '—',
            ].join('\n'),
        });
    } catch (err) {
        console.error('Falha ao avisar moderação por e-mail:', err.message);
    }
}

// ─────────────────────────────────────────
// BLOQUEIOS
// ─────────────────────────────────────────

// GET /moderacao/bloqueios — quem eu bloqueei (para desbloquear)
router.get('/bloqueios', async (req, res) => {
    const { rows } = await db.query(
        `SELECT u.id, u.nome, u.avatar, b.criado_em
         FROM bloqueios b
         JOIN usuarios u ON u.id = b.bloqueado_id
         WHERE b.bloqueador_id = $1
         ORDER BY b.criado_em DESC`,
        [req.user.userId]
    );
    res.json(rows);
});

// GET /moderacao/bloqueios/:usuarioId — situação com um usuário específico
router.get('/bloqueios/:usuarioId', async (req, res) => {
    const { rows } = await db.query(
        `SELECT bloqueador_id FROM bloqueios
         WHERE (bloqueador_id = $1 AND bloqueado_id = $2)
            OR (bloqueador_id = $2 AND bloqueado_id = $1)`,
        [req.user.userId, req.params.usuarioId]
    );
    const uid = parseInt(req.user.userId);
    res.json({
        voce_bloqueou: rows.some(r => r.bloqueador_id === uid),
        bloqueado: rows.length > 0,
    });
});

// POST /moderacao/bloqueios  { usuario_id }
router.post('/bloqueios', async (req, res) => {
    const usuarioId = parseInt(req.user.userId);
    const alvoId = parseInt(req.body?.usuario_id);
    if (!Number.isInteger(alvoId)) return res.status(400).json({ error: 'usuario_id é obrigatório.' });
    if (alvoId === usuarioId) return res.status(400).json({ error: 'Não é possível bloquear a si mesmo.' });
    if (!(await usuarioExiste(alvoId))) return res.status(404).json({ error: 'Usuário não encontrado.' });

    await bloquear(usuarioId, alvoId);

    req.io?.to(`user_${usuarioId}`).emit('atualizar_tela', { tipo: 'bloqueios' });
    req.io?.to(`user_${alvoId}`).emit('atualizar_tela', { tipo: 'vinculos' });
    res.status(201).json({ ok: true });
});

// DELETE /moderacao/bloqueios/:usuarioId — desbloquear
// (amizade, vínculo e chat desfeitos no bloqueio não voltam sozinhos)
router.delete('/bloqueios/:usuarioId', async (req, res) => {
    await db.query(
        'DELETE FROM bloqueios WHERE bloqueador_id = $1 AND bloqueado_id = $2',
        [req.user.userId, req.params.usuarioId]
    );
    res.json({ ok: true });
});

// ─────────────────────────────────────────
// DENÚNCIAS
// ─────────────────────────────────────────

// POST /moderacao/denuncias
// body: { tipo, motivo, detalhes?, usuario_id?, mensagem_id?, conversa_id?, conteudo?, bloquear? }
//   tipo 'usuario'  → usuario_id
//   tipo 'mensagem' → mensagem_id (mensagem do chat recebida pelo denunciante)
//   tipo 'hercules' → conteudo (texto da resposta) e conversa_id, se houver
router.post('/denuncias', limitarDenuncias, async (req, res) => {
    const usuarioId = parseInt(req.user.userId);
    const { tipo, motivo } = req.body || {};
    const detalhes = typeof req.body?.detalhes === 'string' ? req.body.detalhes.trim().slice(0, 1000) : null;

    if (!TIPOS.includes(tipo)) return res.status(400).json({ error: 'Tipo de denúncia inválido.' });
    if (!MOTIVOS.includes(motivo)) return res.status(400).json({ error: 'Motivo inválido.' });

    let denunciadoId = null;
    let referenciaId = null;
    let conteudo = null;

    if (tipo === 'usuario') {
        denunciadoId = parseInt(req.body.usuario_id);
        if (!Number.isInteger(denunciadoId) || denunciadoId === usuarioId) {
            return res.status(400).json({ error: 'Usuário inválido.' });
        }
        const { rows } = await db.query('SELECT nome FROM usuarios WHERE id = $1', [denunciadoId]);
        if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado.' });
        conteudo = `Perfil: ${rows[0].nome}`;
    }

    if (tipo === 'mensagem') {
        referenciaId = parseInt(req.body.mensagem_id);
        if (!Number.isInteger(referenciaId)) return res.status(400).json({ error: 'mensagem_id é obrigatório.' });
        // Só dá para denunciar mensagem de um chat do qual você participa,
        // e que foi enviada pela outra pessoa
        const { rows } = await db.query(
            `SELECT m.remetente_id, m.conteudo
             FROM mensagens m
             JOIN chats c ON c.id = m.chat_id
             WHERE m.id = $1 AND (c.usuario1_id = $2 OR c.usuario2_id = $2)`,
            [referenciaId, usuarioId]
        );
        if (!rows.length || rows[0].remetente_id === usuarioId) {
            return res.status(404).json({ error: 'Mensagem não encontrada.' });
        }
        denunciadoId = rows[0].remetente_id;
        conteudo = rows[0].conteudo;
    }

    if (tipo === 'hercules') {
        conteudo = typeof req.body.conteudo === 'string' ? req.body.conteudo.slice(0, MAX_TEXTO) : '';
        if (!conteudo.trim()) return res.status(400).json({ error: 'Conteúdo é obrigatório.' });
        const conversaId = parseInt(req.body.conversa_id);
        if (Number.isInteger(conversaId)) {
            // A resposta precisa ser do Hércules, numa conversa do próprio usuário
            const { rows } = await db.query(
                `SELECT 1 FROM hercules_mensagens hm
                 JOIN hercules_conversas hc ON hc.id = hm.conversa_id
                 WHERE hm.conversa_id = $1 AND hc.usuario_id = $2
                   AND hm.autor = 'hercules' AND hm.texto = $3
                 LIMIT 1`,
                [conversaId, usuarioId, req.body.conteudo]
            );
            if (!rows.length) return res.status(404).json({ error: 'Resposta não encontrada.' });
            referenciaId = conversaId;
        }
    }

    const { rows } = await db.query(
        `INSERT INTO denuncias (denunciante_id, tipo, denunciado_id, referencia_id, conteudo, motivo, detalhes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [usuarioId, tipo, denunciadoId, referenciaId, conteudo, motivo, detalhes || null]
    );

    // "Denunciar e bloquear" num passo só
    if (req.body.bloquear === true && denunciadoId) await bloquear(usuarioId, denunciadoId);

    await notificarModeracao(rows[0]);
    res.status(201).json({ ok: true, id: rows[0].id });
});

// ── Moderação (admins) ───────────────────────────────────────────────────────

// GET /moderacao/denuncias?status=aberta
router.get('/denuncias', requireAdmin, async (req, res) => {
    const status = ['aberta', 'procedente', 'descartada'].includes(req.query.status) ? req.query.status : 'aberta';
    const { rows } = await db.query(
        `SELECT d.*, den.nome AS denunciante_nome, alvo.nome AS denunciado_nome
         FROM denuncias d
         LEFT JOIN usuarios den  ON den.id  = d.denunciante_id
         LEFT JOIN usuarios alvo ON alvo.id = d.denunciado_id
         WHERE d.status = $1
         ORDER BY d.criado_em DESC
         LIMIT 200`,
        [status]
    );
    res.json(rows);
});

// PATCH /moderacao/denuncias/:id  { status: 'procedente' | 'descartada' }
router.patch('/denuncias/:id', requireAdmin, async (req, res) => {
    const { status } = req.body || {};
    if (!['procedente', 'descartada'].includes(status)) return res.status(400).json({ error: 'Status inválido.' });
    const { rows } = await db.query(
        'UPDATE denuncias SET status = $1, analisada_em = NOW() WHERE id = $2 RETURNING *',
        [status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Denúncia não encontrada.' });
    res.json(rows[0]);
});

module.exports = router;
module.exports.existeBloqueio = existeBloqueio;
