const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Importa o pacote jsonwebtoken
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'; // Chave secreta para o JWT

// Rota de login
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const normalizedEmail = email.toLowerCase();

        const { rows } = await db.query('SELECT * FROM usuarios WHERE email = $1', [normalizedEmail]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        const user = rows[0];
        const senhaValida = await bcrypt.compare(senha, user.senha);
        if (!senhaValida) {
            return res.status(401).json({ error: 'Senha incorreta' });
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
    } catch (err) {
        console.error('Erro durante o login:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Middleware para verificar o JWT
function authenticateJWT(req, res, next) {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }

        // Anexa o usuário decodificado à requisição
        req.user = decoded;
        next();
    });
}

// Rota para verificar a sessão do usuário (substituída para JWT)
router.get('/session', authenticateJWT, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT u.funcao_extra, u.avatar, g.streak_atual, g.maior_streak
             FROM usuarios u
             LEFT JOIN gamificacao_usuario g ON g.usuario_id = u.id
             WHERE u.id = $1`,
            [req.user.userId]
        );
        const fresh = rows[0] || {};
        res.json({
            loggedIn: true,
            userName: req.user.userName,
            userId: req.user.userId,
            userFuncao: req.user.userFuncao,
            userFuncaoExtra: fresh.funcao_extra || null,
            userAvatar: fresh.avatar || req.user.userAvatar,
            streakAtual: fresh.streak_atual || 0,
            maiorStreak: fresh.maior_streak || 0,
        });
    } catch {
        res.json({
            loggedIn: true,
            userName: req.user.userName,
            userId: req.user.userId,
            userFuncao: req.user.userFuncao,
            userFuncaoExtra: req.user.userFuncaoExtra || null,
            userAvatar: req.user.userAvatar
        });
    }
});

module.exports = router;
