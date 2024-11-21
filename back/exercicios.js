// exercicios.js
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./db');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Configuração do Multer para salvar arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Pasta onde os GIFs serão armazenados
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`); // Nome único para o arquivo
    },
});

const upload = multer({ storage });
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
    const { nome_exercicio, grupo_muscular, nivel } = req.body;

    try {
        const resultado = await db.query(
            `INSERT INTO exercicios (nome_exercicio, grupo_muscular, nivel) 
             VALUES ($1, $2, $3) RETURNING *`,
            [nome_exercicio, grupo_muscular, nivel]
        );

        res.status(201).json(resultado.rows[0]);
    } catch (err) {
        console.error('Erro ao criar o exercício:', err);
        res.status(500).json({ error: 'Erro ao criar o exercício' });
    }
});

router.get('/exercicios/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('SELECT * FROM exercicios WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Exercício não encontrado.' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar exercício:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});


// Rota para atualizar exercícios
router.put('/:id', upload.single('gif'), async (req, res) => {
    const { id } = req.params;
    const { nome_exercicio, grupo_muscular, nivel } = req.body;
    const gifUrl = req.file
        ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
        : null;

    try {
        const query = `
            UPDATE exercicios
            SET nome_exercicio = $1, grupo_muscular = $2, nivel = $3, gif_url = COALESCE($4, gif_url)
            WHERE id = $5 RETURNING *
        `;
        const values = [nome_exercicio, grupo_muscular, nivel, gifUrl, id];
        const result = await db.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Exercício não encontrado.' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar exercício:', error);
        res.status(500).json({ error: 'Erro ao atualizar exercício.' });
    }
});


module.exports = router;
