// vinculos.js — Conexões professor ↔ aluno
const express = require('express');
const db      = require('./db');
const { enviarPush } = require('./push');
const router  = express.Router();

// ─────────────────────────────────────────
// TOGGLE PROCURANDO
// PATCH /vinculos/procurando/:userId
// ─────────────────────────────────────────
router.patch('/procurando/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const { rows } = await db.query(
            `UPDATE usuarios
             SET procurando = NOT procurando
             WHERE id = $1
             RETURNING id, procurando`,
            [userId]
        );
        if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado.' });
        res.json(rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar procurando:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// ─────────────────────────────────────────
// PROFESSORES DISPONÍVEIS (para alunos)
// GET /vinculos/professores-disponiveis
// ─────────────────────────────────────────
router.get('/professores-disponiveis', async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT
                u.id, u.nome, u.avatar,
                p.cref, p.especialidade, p.experiencia,
                p.descricao, p.preco_hora, p.cidade, p.estado, p.contato
            FROM usuarios u
            LEFT JOIN professores p ON p.usuario_id = u.id
            WHERE u.funcao = 'Professor'
              AND u.procurando = TRUE
            ORDER BY u.nome
        `);
        res.json(rows);
    } catch (err) {
        console.error('Erro ao buscar professores disponíveis:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// ─────────────────────────────────────────
// ALUNOS DISPONÍVEIS (para professores)
// GET /vinculos/alunos-disponiveis
// ─────────────────────────────────────────
router.get('/alunos-disponiveis', async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT
                u.id, u.nome, u.avatar, u.objetivo,
                u.altura, u.peso,
                EXTRACT(YEAR FROM AGE(u.data_nascimento))::int AS idade
            FROM usuarios u
            WHERE u.funcao = 'Aluno'
              AND u.procurando = TRUE
            ORDER BY u.nome
        `);
        res.json(rows);
    } catch (err) {
        console.error('Erro ao buscar alunos disponíveis:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// ─────────────────────────────────────────
// ENVIAR PEDIDO DE CONEXÃO
// POST /vinculos
// body: { professor_id, aluno_id, iniciado_por }
// ─────────────────────────────────────────
router.post('/', async (req, res) => {
    const { professor_id, aluno_id, iniciado_por } = req.body;
    try {
        // Verifica se o aluno já tem vínculo ativo
        const ativo = await db.query(
            `SELECT id FROM vinculos WHERE aluno_id = $1 AND status = 'ativo'`,
            [aluno_id]
        );
        if (ativo.rows.length) {
            return res.status(409).json({ error: 'Aluno já possui um professor ativo.' });
        }

        // Verifica pedido duplicado pendente
        const pendente = await db.query(
            `SELECT id FROM vinculos
             WHERE professor_id = $1 AND aluno_id = $2 AND status = 'pendente'`,
            [professor_id, aluno_id]
        );
        if (pendente.rows.length) {
            return res.status(409).json({ error: 'Já existe um pedido pendente entre esses usuários.' });
        }

        // Reutiliza registro encerrado ou cria novo
        const existente = await db.query(
            `SELECT id FROM vinculos
             WHERE professor_id = $1 AND aluno_id = $2 AND status = 'encerrado'
             LIMIT 1`,
            [professor_id, aluno_id]
        );

        let rows;
        if (existente.rows.length) {
            const upd = await db.query(
                `UPDATE vinculos
                 SET status = 'pendente', iniciado_por = $1, created_at = NOW()
                 WHERE id = $2
                 RETURNING *`,
                [iniciado_por, existente.rows[0].id]
            );
            rows = upd.rows;
        } else {
            const ins = await db.query(
                `INSERT INTO vinculos (professor_id, aluno_id, iniciado_por)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [professor_id, aluno_id, iniciado_por]
            );
            rows = ins.rows;
        }
        const vinculo = rows[0];

        // notifica o destinatário do pedido
        const destinatarioId = vinculo.iniciado_por === professor_id ? aluno_id : professor_id;
        req.io?.to(`user_${destinatarioId}`).emit('atualizar_tela', { tipo: 'vinculos' });

        const remetenteRes = await db.query(
            'SELECT nome FROM usuarios WHERE id = $1', [vinculo.iniciado_por]
        );
        const destFuncaoRes = await db.query(
            'SELECT funcao FROM usuarios WHERE id = $1', [destinatarioId]
        );
        const remetenteNome = remetenteRes.rows[0]?.nome || 'Alguém';
        const destUrl = destFuncaoRes.rows[0]?.funcao === 'Professor' ? '/usuarios' : '/procurar-professor';
        await enviarPush(destinatarioId, {
            title: 'Novo pedido de conexão',
            body: `${remetenteNome} quer se conectar com você.`,
            url: destUrl
        });

        res.status(201).json(vinculo);
    } catch (err) {
        console.error('Erro ao criar vínculo:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// ─────────────────────────────────────────
// PEDIDOS PENDENTES RECEBIDOS
// GET /vinculos/pendentes/:userId
// ─────────────────────────────────────────
router.get('/pendentes/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // Pedidos onde o usuário é o destinatário (não foi ele quem iniciou)
        const { rows } = await db.query(`
            SELECT
                v.id, v.professor_id, v.aluno_id, v.iniciado_por, v.created_at,
                prof.nome  AS professor_nome,  prof.avatar  AS professor_avatar,
                aluno.nome AS aluno_nome,       aluno.avatar AS aluno_avatar,
                p.especialidade, p.cref
            FROM vinculos v
            JOIN usuarios prof  ON prof.id  = v.professor_id
            JOIN usuarios aluno ON aluno.id = v.aluno_id
            LEFT JOIN professores p ON p.usuario_id = v.professor_id
            WHERE v.status = 'pendente'
              AND v.iniciado_por != $1
              AND ($1 = v.professor_id OR $1 = v.aluno_id)
            ORDER BY v.created_at DESC
        `, [userId]);
        res.json(rows);
    } catch (err) {
        console.error('Erro ao buscar pendentes:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// ─────────────────────────────────────────
// ACEITAR PEDIDO
// PATCH /vinculos/:id/aceitar
// ─────────────────────────────────────────
router.patch('/:id/aceitar', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('BEGIN');

        const { rows } = await db.query(
            `UPDATE vinculos SET status = 'ativo' WHERE id = $1 AND status = 'pendente' RETURNING *`,
            [id]
        );
        if (!rows.length) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'Pedido não encontrado ou já processado.' });
        }

        const vinculo = rows[0];

        await db.query(
            `UPDATE vinculos SET status = 'encerrado'
             WHERE aluno_id = $1 AND status = 'pendente' AND id != $2`,
            [vinculo.aluno_id, id]
        );

        // Cria o chat entre professor e aluno (se ainda não existir)
        await db.query(
            `INSERT INTO chats (usuario1_id, usuario2_id)
             SELECT $1, $2
             WHERE NOT EXISTS (
                 SELECT 1 FROM chats
                 WHERE (usuario1_id = $1 AND usuario2_id = $2)
                    OR (usuario1_id = $2 AND usuario2_id = $1)
             )`,
            [vinculo.professor_id, vinculo.aluno_id]
        );

        await db.query('COMMIT');

        // notifica ambos em tempo real
        req.io?.to(`user_${vinculo.professor_id}`).emit('atualizar_tela', { tipo: 'vinculos' });
        req.io?.to(`user_${vinculo.aluno_id}`).emit('atualizar_tela', { tipo: 'vinculos' });

        // push para quem iniciou o pedido (recebe a confirmação)
        const outroId = vinculo.iniciado_por === vinculo.professor_id ? vinculo.aluno_id : vinculo.professor_id;
        const nomeRes = await db.query('SELECT nome FROM usuarios WHERE id = $1', [outroId]);
        const funcaoRes = await db.query('SELECT funcao FROM usuarios WHERE id = $1', [vinculo.iniciado_por]);
        const outroNome = nomeRes.rows[0]?.nome || 'Alguém';
        const iniciadorUrl = funcaoRes.rows[0]?.funcao === 'Professor' ? '/usuarios' : '/procurar-professor';
        await enviarPush(vinculo.iniciado_por, {
            title: 'Pedido aceito!',
            body: `${outroNome} aceitou seu pedido de conexão.`,
            url: iniciadorUrl
        });

        res.json(vinculo);
    } catch (err) {
        await db.query('ROLLBACK').catch(() => {});
        console.error('Erro ao aceitar vínculo:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// ─────────────────────────────────────────
// RECUSAR PEDIDO
// PATCH /vinculos/:id/recusar
// ─────────────────────────────────────────
router.patch('/:id/recusar', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query(
            `UPDATE vinculos SET status = 'encerrado'
             WHERE id = $1 AND status = 'pendente'
             RETURNING *`,
            [id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Pedido não encontrado ou já processado.' });
        const vinculo = rows[0];

        req.io?.to(`user_${vinculo.professor_id}`).emit('atualizar_tela', { tipo: 'vinculos' });
        req.io?.to(`user_${vinculo.aluno_id}`).emit('atualizar_tela', { tipo: 'vinculos' });

        const funcaoInicRes = await db.query('SELECT funcao FROM usuarios WHERE id = $1', [vinculo.iniciado_por]);
        const recusadoUrl = funcaoInicRes.rows[0]?.funcao === 'Professor' ? '/usuarios' : '/procurar-professor';
        await enviarPush(vinculo.iniciado_por, {
            title: 'Pedido recusado',
            body: 'Seu pedido de conexão foi recusado.',
            url: recusadoUrl
        });

        res.json(vinculo);
    } catch (err) {
        console.error('Erro ao recusar vínculo:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// ─────────────────────────────────────────
// ENCERRAR VÍNCULO ATIVO
// DELETE /vinculos/:id
// ─────────────────────────────────────────
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('BEGIN');

        const { rows } = await db.query(
            `UPDATE vinculos SET status = 'encerrado'
             WHERE id = $1 AND status = 'ativo'
             RETURNING *`,
            [id]
        );
        if (!rows.length) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'Vínculo não encontrado.' });
        }

        const { professor_id, aluno_id } = rows[0];

        // Arquiva o chat entre os dois
        await db.query(
            `UPDATE chats SET arquivado = TRUE
             WHERE (usuario1_id = $1 AND usuario2_id = $2)
                OR (usuario1_id = $2 AND usuario2_id = $1)`,
            [professor_id, aluno_id]
        );

        await db.query('COMMIT');
        res.json({ message: 'Vínculo encerrado.' });
    } catch (err) {
        await db.query('ROLLBACK').catch(() => {});
        console.error('Erro ao encerrar vínculo:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// ─────────────────────────────────────────
// MEU PROFESSOR (aluno)
// GET /vinculos/meu-professor/:alunoId
// ─────────────────────────────────────────
router.get('/meu-professor/:alunoId', async (req, res) => {
    const { alunoId } = req.params;
    try {
        const { rows } = await db.query(`
            SELECT
                v.id AS vinculo_id,
                u.id, u.nome, u.avatar,
                p.cref, p.especialidade, p.experiencia,
                p.descricao, p.preco_hora, p.cidade, p.estado, p.contato,
                c.id AS chat_id
            FROM vinculos v
            JOIN usuarios u ON u.id = v.professor_id
            LEFT JOIN professores p ON p.usuario_id = v.professor_id
            LEFT JOIN chats c ON (
                (c.usuario1_id = v.professor_id AND c.usuario2_id = v.aluno_id) OR
                (c.usuario1_id = v.aluno_id     AND c.usuario2_id = v.professor_id)
            )
            WHERE v.aluno_id = $1 AND v.status = 'ativo'
            LIMIT 1
        `, [alunoId]);
        res.json(rows[0] || null);
    } catch (err) {
        console.error('Erro ao buscar professor:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// ─────────────────────────────────────────
// MEUS ALUNOS (professor)
// GET /vinculos/meus-alunos/:professorId
// ─────────────────────────────────────────
router.get('/meus-alunos/:professorId', async (req, res) => {
    const { professorId } = req.params;
    try {
        const { rows } = await db.query(`
            SELECT
                v.id AS vinculo_id,
                u.id, u.nome, u.avatar, u.objetivo,
                u.altura, u.peso,
                EXTRACT(YEAR FROM AGE(u.data_nascimento))::int AS idade,
                c.id AS chat_id
            FROM vinculos v
            JOIN usuarios u ON u.id = v.aluno_id
            LEFT JOIN chats c ON (
                (c.usuario1_id = v.professor_id AND c.usuario2_id = v.aluno_id) OR
                (c.usuario1_id = v.aluno_id     AND c.usuario2_id = v.professor_id)
            )
            WHERE v.professor_id = $1 AND v.status = 'ativo'
            ORDER BY u.nome
        `, [professorId]);
        res.json(rows);
    } catch (err) {
        console.error('Erro ao buscar alunos:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// ─────────────────────────────────────────
// HISTÓRICO DE PROFESSORES (aluno)
// GET /vinculos/historico-professor/:alunoId
// ─────────────────────────────────────────
router.get('/historico-professor/:alunoId', async (req, res) => {
    const { alunoId } = req.params;
    try {
        const { rows } = await db.query(`
            SELECT
                v.id AS vinculo_id,
                v.created_at,
                u.id, u.nome, u.avatar,
                p.especialidade, p.cidade, p.estado,
                c.id AS chat_id
            FROM vinculos v
            JOIN usuarios u ON u.id = v.professor_id
            LEFT JOIN professores p ON p.usuario_id = v.professor_id
            LEFT JOIN chats c ON (
                (c.usuario1_id = v.professor_id AND c.usuario2_id = v.aluno_id) OR
                (c.usuario1_id = v.aluno_id     AND c.usuario2_id = v.professor_id)
            )
            WHERE v.aluno_id = $1 AND v.status = 'encerrado'
            ORDER BY v.created_at DESC
        `, [alunoId]);
        res.json(rows);
    } catch (err) {
        console.error('Erro ao buscar histórico de professores:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

module.exports = router;
