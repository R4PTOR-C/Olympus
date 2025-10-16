const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./config/cloudinary');
const router = express.Router();

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'olympus_usuarios',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        resource_type: 'image',
    },
});
const upload = multer({ storage });

// =================== ROTAS =================== //

// GET - lista todos os usuários
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM usuarios');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET - pega usuário por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query('SELECT * FROM usuarios WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error("Erro ao buscar usuário:", err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST - cria novo usuário com avatar
router.post('/', upload.single('avatar'), async (req, res) => {
    const { nome, email, genero, senha, funcao, data_nascimento, telefone, altura, peso, objetivo } = req.body;
    const avatar = req.file ? req.file.path : null;
    const normalizedEmail = email.toLowerCase();

    try {
        // Verifica se o email já existe
        const existingUser = await db.query('SELECT * FROM usuarios WHERE email = $1', [normalizedEmail]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email já cadastrado.' });
        }

        const hashedPassword = await bcrypt.hash(senha, 10);

        const resultado = await db.query(
            `INSERT INTO usuarios 
            (nome, email, genero, senha, funcao, avatar, data_nascimento, telefone, altura, peso, objetivo) 
            VALUES ($1,$2,$3,$5,$6,$7,$8,$9,$10,$11,$12) 
            RETURNING *`,
            [nome, normalizedEmail, genero, hashedPassword, funcao, avatar, data_nascimento || null, telefone || null, altura || null, peso || null, objetivo || null]
        );

        res.status(201).json(resultado.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// DELETE - remove usuário
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
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

// PUT - atualiza usuário
router.put('/:id', upload.single('avatar'), async (req, res) => {
    const { id } = req.params;
    const campos = [];
    const values = [];
    let paramIndex = 1;

    // Lista de campos que podem ser atualizados
    const permitidos = ['nome', 'email', 'genero', 'idade', 'data_nascimento', 'telefone', 'altura', 'peso', 'objetivo'];

    try {
        // Monta a query apenas com os campos enviados no body
        for (const campo of permitidos) {
            if (req.body[campo] !== undefined) {
                campos.push(`${campo} = $${paramIndex}`);
                values.push(req.body[campo]);
                paramIndex++;
            }
        }

        // senha só atualiza se vier preenchida
        if (req.body.senha) {
            const hashedPassword = await bcrypt.hash(req.body.senha, 10);
            campos.push(`senha = $${paramIndex}`);
            values.push(hashedPassword);
            paramIndex++;
        }

        // avatar só atualiza se houver upload
        if (req.file) {
            campos.push(`avatar = $${paramIndex}`);
            values.push(req.file.path);
            paramIndex++;
        }

        if (campos.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo válido enviado para atualização' });
        }

        const query = `UPDATE usuarios SET ${campos.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        values.push(id);

        const resultado = await db.query(query, values);

        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({ message: 'Usuário atualizado com sucesso', usuario: resultado.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});


// POST - forgot password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const normalizedEmail = email.toLowerCase();
        if (!normalizedEmail) return res.status(400).json({ error: 'Email é obrigatório' });

        const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [normalizedEmail]);
        const user = result.rows[0];
        if (!user) return res.status(400).json({ error: 'Usuário não encontrado' });

        const token = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 3600000);

        await db.query(
            'UPDATE usuarios SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3',
            [token, tokenExpires, normalizedEmail]
        );

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: 'olympusgymapp@gmail.com', pass: 'ndfi llcd tqqm gdos' },
        });

        const mailOptions = {
            to: normalizedEmail,
            from: 'olympusgymapp@gmail.com',
            subject: 'Redefinição de senha',
            text: `Clique no link para redefinir sua senha:\n\nhttps://olympus-33lb.onrender.com/nova_senha/${token}\n\nSe não foi você, ignore este email.`,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email de redefinição de senha enviado' });
    } catch (error) {
        console.error('Erro no endpoint /forgot-password:', error);
        res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
});

// POST - reset password
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { senha } = req.body;

    try {
        const currentDate = new Date().toISOString();
        const { rows } = await db.query(
            'SELECT * FROM usuarios WHERE reset_password_token = $1 AND reset_password_expires > $2',
            [token, currentDate]
        );
        const user = rows[0];
        if (!user) return res.status(400).json({ error: 'Token inválido ou expirado' });

        const hashedPassword = await bcrypt.hash(senha, 10);

        await db.query(
            'UPDATE usuarios SET senha = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE email = $2',
            [hashedPassword, user.email]
        );

        res.status(200).json({ message: 'Senha redefinida com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao redefinir senha' });
    }
});

module.exports = router;
