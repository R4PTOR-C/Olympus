const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const { JWT_SECRET } = require('../config/jwt');

// Rota de login
router.post('/login', async (req, res) => {
    const { email, senha } = req.body || {};
    if (typeof email !== 'string' || typeof senha !== 'string' || !email.trim() || !senha) {
        return res.status(400).json({ error: 'Informe email e senha.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const { rows } = await db.query('SELECT * FROM usuarios WHERE email = $1', [normalizedEmail]);
    const user = rows[0];

    // Mesma resposta para email inexistente e senha errada: não revela quem tem conta
    const senhaValida = user ? await bcrypt.compare(senha, user.senha) : false;
    if (!senhaValida) {
        return res.status(401).json({ error: 'Email ou senha incorretos.' });
    }

    // Gera o token JWT com informações do usuário
    const token = jwt.sign(
        { userId: user.id, userName: user.nome, userFuncao: user.funcao, userFuncaoExtra: user.funcao_extra || null, userAvatar: user.avatar },
        JWT_SECRET,
        { expiresIn: '7d' } // 7 dias
    );

    res.json({
        message: 'Login bem-sucedido',
        token,
        userId: user.id,
        userName: user.nome,
        funcao: user.funcao,
        funcao_extra: user.funcao_extra || null,
        avatar: user.avatar
    });
});

// Sessão atual. Lê do banco (e não só do token) para refletir mudanças de
// nome/função/avatar feitas depois do login — e para derrubar tokens de contas
// já excluídas.
router.get('/session', authenticate, async (req, res) => {
    const { rows } = await db.query(
        `SELECT u.nome, u.email, u.funcao, u.funcao_extra, u.avatar, u.email_verificado, g.streak_atual, g.maior_streak
         FROM usuarios u
         LEFT JOIN gamificacao_usuario g ON g.usuario_id = u.id
         WHERE u.id = $1`,
        [req.user.userId]
    );
    if (!rows.length) return res.status(401).json({ error: 'Conta não encontrada.' });
    const u = rows[0];
    res.json({
        loggedIn: true,
        userName: u.nome,
        userId: req.user.userId,
        userFuncao: u.funcao,
        userFuncaoExtra: u.funcao_extra || null,
        userAvatar: u.avatar,
        streakAtual: u.streak_atual || 0,
        maiorStreak: u.maior_streak || 0,
        email: u.email,
        emailVerificado: u.email_verificado !== false,
    });
});

module.exports = router;
