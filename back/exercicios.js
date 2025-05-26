// exercicios.js
const express = require('express');
const db = require('./db');
const router = express.Router();

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./config/cloudinary');

// Configura o storage para Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'olympus_exercicios', // Nome da pasta no Cloudinary
        allowed_formats: ['gif'],
        resource_type: 'image',
    },
});

const upload = multer({ storage });

function toTitleCase(str) {
    return str
        .toLowerCase()
        .split(' ')
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
}


// Listar exercícios
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM exercicios');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Criar exercício (com upload opcional de gif)
router.post('/', upload.single('gif'), async (req, res) => {
    let { nome_exercicio, grupo_muscular, nivel } = req.body;
    nome_exercicio = toTitleCase(nome_exercicio);
    const gifUrl = req.file?.path || null; // URL pública do Cloudinary

    try {
        const resultado = await db.query(
            `INSERT INTO exercicios (nome_exercicio, grupo_muscular, nivel, gif_url)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [nome_exercicio, grupo_muscular, nivel, gifUrl]
        );

        res.status(201).json(resultado.rows[0]);
    } catch (err) {
        console.error('Erro ao criar o exercício:', err);
        res.status(500).json({ error: 'Erro ao criar o exercício' });
    }
});

// Buscar por ID
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

// Atualizar exercício (com gif opcional)
router.put('/:id', upload.single('gif'), async (req, res) => {
    const { id } = req.params;
    let { nome_exercicio, grupo_muscular, nivel } = req.body;
    nome_exercicio = toTitleCase(nome_exercicio);
    const gifUrl = req.file?.path || null;

    try {
        const query = `
            UPDATE exercicios
            SET nome_exercicio = $1,
                grupo_muscular = $2,
                nivel = $3,
                gif_url = COALESCE($4, gif_url)
            WHERE id = $5
                RETURNING *;
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
