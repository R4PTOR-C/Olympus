// exercicios.js
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./db');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM exercicios');
        console.log(rows); // Imprime os dados na console do servidor
        res.json(rows); // Envia os dados como JSON para o cliente
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', async (req, res) => {
    const {nome_exercicio} = req.body;

    try {
        // Inserir a academia com a senha hash no banco de dados
        const resultado = await db.query(
            'INSERT INTO exercicios (nome_exercicio) VALUES ($1) RETURNING *',
            [nome_exercicio]
        );
        res.status(201).json(resultado.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
