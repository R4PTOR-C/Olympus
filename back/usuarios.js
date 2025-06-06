// usuarios.js
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

router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { rows } = await db.query('SELECT * FROM usuarios WHERE id = $1', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("Erro ao buscar o usuário:", err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para criar um novo usuário com upload de avatar
router.post('/', upload.single('avatar'), async (req, res) => {
    const { nome, email, genero, idade, senha, funcao } = req.body;
    const avatar = req.file ? req.file.path : null;
    const normalizedEmail = email.toLowerCase();

    try {
        // Verifica se o email já existe
        const existingUser = await db.query(
            'SELECT * FROM usuarios WHERE email = $1',
            [normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email já cadastrado.' });
        }

        const hashedPassword = await bcrypt.hash(senha, 10);

        const resultado = await db.query(
            'INSERT INTO usuarios (nome, email, genero, idade, senha, funcao, avatar) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [nome, normalizedEmail, genero, idade, hashedPassword, funcao, avatar]
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

// Rota para atualizar o usuário e o avatar
router.put('/:id', upload.single('avatar'), async (req, res) => {
    console.log('Arquivo recebido:', req.file); // ✅ Verifique se chega aqui
    const { id } = req.params;
    const { nome, email, genero, idade, senha } = req.body;
    const avatar = req.file ? req.file.path : null; // ✅ URL do Cloudinary

    try {
        let query = 'UPDATE usuarios SET nome = $1, email = $2, genero = $3, idade = $4';
        const values = [nome, email, genero, idade];
        let paramIndex = 5;

        // Atualizar a senha se fornecida
        if (senha) {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(senha, saltRounds);
            query += `, senha = $${paramIndex}`;
            values.push(hashedPassword);
            paramIndex += 1;
        }

        // Atualizar o avatar se fornecido
        if (avatar) {
            query += `, avatar = $${paramIndex}`;
            values.push(avatar);
            paramIndex += 1;
        }

        query += ` WHERE id = $${paramIndex} RETURNING *`;
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

// Rota para solicitar redefinição de senha
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        // Converta o e-mail para minúsculas
        const normalizedEmail = email.toLowerCase();

        // Verifique se o e-mail é fornecido
        if (!normalizedEmail) {
            return res.status(400).json({ error: 'Email é obrigatório' });
        }

        // Verifique se o usuário existe
        const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [normalizedEmail]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ error: 'Usuário não encontrado' });
        }

        // Gere o token e defina a expiração
        const token = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 3600000); // Adiciona uma hora

        // Atualize o usuário com o token e a expiração
        await db.query('UPDATE usuarios SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3', [token, tokenExpires, normalizedEmail]);

        // Configure o transporte do email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'olympusgymapp@gmail.com',
                pass: 'ndfi llcd tqqm gdos',
            },
        });

        // Configure as opções do email
        const mailOptions = {
            to: normalizedEmail,
            from: 'olympusgymapp@gmail.com',
            subject: 'Redefinição de senha',
            text: `Você está recebendo este email porque você (ou outra pessoa) solicitou a redefinição de senha para a sua conta.\n\n
                   Por favor, clique no seguinte link ou cole-o no seu navegador para completar o processo dentro de uma hora:\n\n
                   https://olympus-33lb.onrender.com/nova_senha/${token}\n\n
                   Se você não solicitou essa redefinição, por favor, ignore este email e sua senha permanecerá inalterada.\n`,
        };

        // Envie o email
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email de redefinição de senha enviado' });
    } catch (error) {
        console.error('Erro no endpoint /forgot-password:', error);
        res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
});


// Rota para redefinir a senha
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { senha } = req.body;

    try {
        // Converte o timestamp atual para o formato ISO
        const currentDate = new Date().toISOString();

        // Consulta para verificar se o token é válido e não expirou
        const { rows } = await db.query(
            'SELECT * FROM usuarios WHERE reset_password_token = $1 AND reset_password_expires > $2',
            [token, currentDate]
        );
        const user = rows[0];

        if (!user) {
            return res.status(400).json({ error: 'Token inválido ou expirado' });
        }

        // Hash da nova senha
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(senha, saltRounds);

        // Atualiza a senha e limpa o token de redefinição
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
