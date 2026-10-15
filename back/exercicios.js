// exercicios.js — catálogo global de exercícios.
// Leitura: qualquer usuário logado. Escrita: só administradores (ADMIN_USER_IDS).
const express = require('express');
const db = require('./db');
const router = express.Router();

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./config/cloudinary');
const { authenticate, requireAdmin } = require('./middleware/auth');

// Configura o storage para Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => ({
        folder: 'olympus_exercicios',
        allowed_formats: ['gif', 'mp4', 'mov', 'webm'],
        resource_type: file.mimetype.startsWith('video/') ? 'video' : 'image',
    }),
});

const upload = multer({ storage, limits: { fileSize: 30 * 1024 * 1024 } });

function toTitleCase(str) {
    return str
        .trim()
        .toLowerCase()
        .split(' ')
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
}

// Valida o body de criação/edição. Devolve a mensagem de erro, ou null.
function validar({ nome_exercicio, grupo_muscular }) {
    if (typeof nome_exercicio !== 'string' || !nome_exercicio.trim()) return 'Nome do exercício é obrigatório.';
    if (typeof grupo_muscular !== 'string' || !grupo_muscular.trim()) return 'Grupo muscular é obrigatório.';
    return null;
}

// Listar exercícios
router.get('/', authenticate, async (req, res) => {
    const { rows } = await db.query('SELECT * FROM exercicios');
    res.json(rows);
});

// Criar exercício (com upload opcional de gif ou vídeo)
router.post('/', authenticate, requireAdmin, upload.single('media'), async (req, res) => {
    const erro = validar(req.body);
    if (erro) return res.status(400).json({ error: erro });
    const { grupo_muscular, nivel } = req.body;
    const nome_exercicio = toTitleCase(req.body.nome_exercicio);
    const gifUrl = req.file?.path || null; // URL pública do Cloudinary

    const resultado = await db.query(
        `INSERT INTO exercicios (nome_exercicio, grupo_muscular, nivel, gif_url)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [nome_exercicio, grupo_muscular, nivel, gifUrl]
    );
    res.status(201).json(resultado.rows[0]);
});

// Buscar por ID
// (o caminho /exercicios/exercicios/:id é mantido por compatibilidade com o front)
router.get(['/exercicios/:id', '/:id'], authenticate, async (req, res) => {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM exercicios WHERE id = $1', [id]);
    if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Exercício não encontrado.' });
    }
    res.json(result.rows[0]);
});

// Atualizar exercício (com gif ou vídeo opcional)
router.put('/:id', authenticate, requireAdmin, upload.single('media'), async (req, res) => {
    const erro = validar(req.body);
    if (erro) return res.status(400).json({ error: erro });
    const { id } = req.params;
    const { grupo_muscular, nivel } = req.body;
    const nome_exercicio = toTitleCase(req.body.nome_exercicio);
    const gifUrl = req.file?.path || null;

    const result = await db.query(
        `UPDATE exercicios
         SET nome_exercicio = $1,
             grupo_muscular = $2,
             nivel = $3,
             gif_url = COALESCE($4, gif_url)
         WHERE id = $5
         RETURNING *`,
        [nome_exercicio, grupo_muscular, nivel, gifUrl, id]
    );

    if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Exercício não encontrado.' });
    }
    res.json(result.rows[0]);
});

// Deletar exercício por ID
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const result = await db.query('DELETE FROM exercicios WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Exercício não encontrado.' });
    }
    res.status(200).json({ message: 'Exercício deletado com sucesso.' });
});

module.exports = router;
