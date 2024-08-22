// academias.js
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./db');

const router = express.Router();

// Rota para criar uma nova academia
router.post('/', async (req, res) => {
    const { nome, cnpj, nome_dono, email, senha } = req.body;

    try {
        // Gerar um hash da senha
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(senha, saltRounds);

        // Inserir a academia com a senha hash no banco de dados
        const resultado = await db.query(
            'INSERT INTO academia (nome, cnpj, nome_dono, email, senha) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nome, cnpj, nome_dono, email, hashedPassword]
        );
        res.status(201).json(resultado.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
