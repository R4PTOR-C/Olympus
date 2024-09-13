// academias.js
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');

const router = express.Router();

// Rota para listar todas as academias
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM academias');
        console.log(rows); // Imprime os dados na console do servidor
        res.json(rows); // Envia os dados como JSON para o cliente
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Rota para criar uma nova academia
router.post('/', async (req, res) => {
    const { nome, cnpj, nome_dono, email, senha, cep, logradouro, complemento, unidade, bairro, localidade, uf } = req.body;

    try {
        // Gerar um hash da senha
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(senha, saltRounds);

        // Inserir a academia com a senha hash no banco de dados
        const resultado = await db.query(
            'INSERT INTO academia (nome, cnpj, nome_dono, email, senha, cep, logradouro, complemento, unidade, bairro, localidade, uf ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
            [nome, cnpj, nome_dono, email, hashedPassword, cep, logradouro, complemento, unidade, bairro, localidade, uf ]
        );
        res.status(201).json(resultado.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
