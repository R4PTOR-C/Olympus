
// usuarios_login.js
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');

const router = express.Router();

// Rota de login
router.post('/academias_login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const normalizedEmail = email.toLowerCase();

        const { rows } = await db.query('SELECT * FROM academias WHERE email = $1', [normalizedEmail]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Academia não encontrada' });
        }
        const user = rows[0];
        const senhaValida = await bcrypt.compare(senha, user.senha);
        if (!senhaValida) {
            return res.status(401).json({ error: 'Senha incorreta' });
        }
        // Armazena o ID e o nome do usuário na sessão
        req.session.userId = user.id;
        req.session.userName = user.nome; // Adiciona o nome do usuário na sessão
        res.json({ message: 'Login bem-sucedido', userName: user.nome });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Rota para verificar a sessão do usuário
router.get('/session', (req, res) => {
    if (req.session.userId) {
        res.json({ loggedIn: true, userName: req.session.userName });
    } else {
        res.json({ loggedIn: false });
    }
});

module.exports = router;
