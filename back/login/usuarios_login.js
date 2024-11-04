const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');

const router = express.Router();

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
        // Armazena o ID e o nome do usuário na sessão
        req.session.userId = user.id;
        req.session.userName = user.nome; // Adiciona o nome do usuário na sessão
        req.session.userFuncao = user.funcao; // Armazena a função na sessão
        res.json({ message: 'Login bem-sucedido', userName: user.nome, funcao: user.funcao });
    } catch (err) {
        console.error('Erro durante o login:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para verificar a sessão do usuário
router.get('/session', (req, res) => {
    console.log('Sessão no servidor:', req.session);
    if (req.session && req.session.userId) {
        res.json({ loggedIn: true, userName: req.session.userName, userId: req.session.userId, userFuncao: req.session.userFuncao });
    } else {
        res.json({ loggedIn: false });
    }
});


module.exports = router;
