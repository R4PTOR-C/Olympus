const express = require('express');
const router = express.Router();
const db = require('./db'); // ajuste o caminho conforme sua estrutura

// 🟢 1. Criar ou retornar um chat entre dois usuários
router.post('/iniciar', async (req, res) => {
    const { usuario1_id, usuario2_id } = req.body;

    if (!usuario1_id || !usuario2_id) {
        return res.status(400).json({ error: 'IDs dos usuários são obrigatórios.' });
    }

    try {
        // Verifica se já existe um chat entre esses usuários
        const { rows: existentes } = await db.query(
            `SELECT * FROM chats
             WHERE (usuario1_id = $1 AND usuario2_id = $2)
                OR (usuario1_id = $2 AND usuario2_id = $1)`,
            [usuario1_id, usuario2_id]
        );

        if (existentes.length > 0) {
            return res.json(existentes[0]);
        }

        // Cria novo chat
        const { rows } = await db.query(
            `INSERT INTO chats (usuario1_id, usuario2_id)
             VALUES ($1, $2)
                 RETURNING *`,
            [usuario1_id, usuario2_id]
        );

        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Erro ao iniciar chat:', err);
        res.status(500).json({ error: 'Erro interno ao iniciar chat.' });
    }
});

// 🟠 2. Listar todos os chats de um usuário (para exibir conversas recentes)
router.get('/usuario/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { rows } = await db.query(
            `SELECT
                 c.id AS chat_id,
                 c.arquivado,
                 u.id AS parceiro_id,
                 u.nome AS parceiro_nome,
                 u.avatar AS parceiro_avatar,
                 u.funcao AS parceiro_funcao,
                 (
                     SELECT conteudo
                     FROM mensagens m
                     WHERE m.chat_id = c.id
                     ORDER BY m.criado_em DESC
                     LIMIT 1
                 ) AS ultima_mensagem,
                (
                    SELECT criado_em
                    FROM mensagens m
                    WHERE m.chat_id = c.id
                    ORDER BY m.criado_em DESC
                    LIMIT 1
                ) AS ultima_data
             FROM chats c
                 JOIN usuarios u
             ON (u.id = CASE WHEN c.usuario1_id = $1 THEN c.usuario2_id ELSE c.usuario1_id END)
             WHERE c.usuario1_id = $1 OR c.usuario2_id = $1
             ORDER BY c.arquivado ASC, ultima_data DESC NULLS LAST`,
            [id]
        );

        res.json(rows);
    } catch (err) {
        console.error('Erro ao listar chats:', err);
        res.status(500).json({ error: 'Erro interno ao buscar chats.' });
    }
});

// 🔵 3. Listar mensagens de um chat
router.get('/mensagens/:chatId', async (req, res) => {
    const { chatId } = req.params;

    try {
        const { rows } = await db.query(
            `SELECT
                 m.id,
                 m.chat_id,
                 m.remetente_id,
                 u.nome AS remetente_nome,
                 u.avatar AS remetente_avatar,
                 m.conteudo,
                 m.criado_em,
                 m.lida
             FROM mensagens m
                      JOIN usuarios u ON u.id = m.remetente_id
             WHERE m.chat_id = $1
             ORDER BY m.criado_em ASC`,
            [chatId]
        );

        res.json(rows);
    } catch (err) {
        console.error('Erro ao buscar mensagens:', err);
        res.status(500).json({ error: 'Erro interno ao buscar mensagens.' });
    }
});

// 🟣 4. Enviar nova mensagem
router.post('/mensagens', async (req, res) => {
    const { chat_id, remetente_id, conteudo } = req.body;

    if (!chat_id || !remetente_id || !conteudo) {
        return res.status(400).json({ error: 'chat_id, remetente_id e conteudo são obrigatórios.' });
    }

    try {
        const { rows } = await db.query(
            `INSERT INTO mensagens (chat_id, remetente_id, conteudo)
             VALUES ($1, $2, $3)
                 RETURNING *`,
            [chat_id, remetente_id, conteudo]
        );

        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Erro ao enviar mensagem:', err);
        res.status(500).json({ error: 'Erro interno ao enviar mensagem.' });
    }
});

// 🟤 5. Buscar dados de um chat específico (para exibir avatar e nome do parceiro)
router.get('/:chatId', async (req, res) => {
    const { chatId } = req.params;

    try {
        const { rows } = await db.query(`
            SELECT 
                c.id,
                c.usuario1_id,
                c.usuario2_id,
                u1.nome AS nome1,
                u1.avatar AS avatar1,
                u2.nome AS nome2,
                u2.avatar AS avatar2
            FROM chats c
            JOIN usuarios u1 ON u1.id = c.usuario1_id
            JOIN usuarios u2 ON u2.id = c.usuario2_id
            WHERE c.id = $1
        `, [chatId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Chat não encontrado.' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('Erro ao buscar chat:', err);
        res.status(500).json({ error: 'Erro interno ao buscar chat.' });
    }
});

module.exports = router;
