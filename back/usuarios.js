// usuarios.js
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./db');

const router = express.Router();

// Rota para listar todos os usuários
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM usuarios');
        console.log(rows); // Imprime os dados na console do servidor
        res.json(rows); // Envia os dados como JSON para o cliente
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Rota para criar um novo usuário
router.post('/', async (req, res) => {
    const { nome, email, genero, idade, senha, funcao } = req.body;

    try {
        // Gerar um hash da senha
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(senha, saltRounds);

        // Inserir o usuário com a senha hash no banco de dados
        const resultado = await db.query(
            'INSERT INTO usuarios (nome, email, genero, idade, senha, funcao) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [nome, email, genero, idade, hashedPassword, funcao]
        );
        res.status(201).json(resultado.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Rota para deletar um usuário
router.delete('/:id', async (req, res) => {
    const { id } = req.params; // Pega o ID da URL

    try {
        const resultado = await db.query('DELETE FROM usuarios WHERE id = $1 RETURNING *', [id]);

        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({ message: 'Usuário deletado com sucesso', usuario: resultado.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
