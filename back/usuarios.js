const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./db');
const crypto = require('crypto');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./config/cloudinary');
const { enviarEmail } = require('./config/email');
const { authenticate, requireAdmin, requireSelf, verificarVinculo } = require('./middleware/auth');
const router = express.Router();

// Link do e-mail de redefinição de senha
const APP_URL = process.env.APP_URL || 'https://www.atlanteontraining.com.br';

const FUNCOES = ['Aluno', 'Professor'];
const SENHA_MIN = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Remove campos sensíveis antes de devolver um usuário ao cliente
const limparUsuario = (u) => {
    if (!u) return u;
    const { senha, reset_password_token, reset_password_expires, ...resto } = u;
    return resto;
};

const normalizarEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');

// O token de reset é guardado só como hash: quem ler o banco não consegue usá-lo
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'olympus_usuarios',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        resource_type: 'image',
    },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// usuarios.avatar guarda a URL do Cloudinary; o public_id é "pasta/nome" sem a
// extensão. Só aceita arquivos da pasta de avatares, pra nunca apagar outra coisa.
const avatarPublicId = (url) => {
    const m = /\/(olympus_usuarios\/[^/.]+)\.[a-z0-9]+$/i.exec(url || '');
    return m ? m[1] : null;
};

// Falha no Cloudinary não desfaz a operação no banco — só fica no log.
const apagarAvatarCloudinary = async (url) => {
    const publicId = avatarPublicId(url);
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (err) {
        console.error(`Falha ao apagar avatar ${publicId} no Cloudinary:`, err.message);
    }
};

// =================== ROTAS =================== //

// GET - lista todos os usuários (só administradores)
router.get('/', authenticate, requireAdmin, async (req, res) => {
    const { rows } = await db.query('SELECT * FROM usuarios ORDER BY id');
    res.json(rows.map(limparUsuario));
});

// POST - forgot password
// Responde sempre igual, exista ou não a conta (não revela quem é usuário).
router.post('/forgot-password', async (req, res) => {
    const normalizedEmail = normalizarEmail(req.body?.email);
    if (!normalizedEmail) return res.status(400).json({ error: 'Email é obrigatório' });

    const resposta = { message: 'Se o email estiver cadastrado, você receberá o link de redefinição.' };

    const { rows } = await db.query('SELECT id FROM usuarios WHERE email = $1', [normalizedEmail]);
    if (!rows.length) return res.json(resposta);

    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 3600000);

    await db.query(
        'UPDATE usuarios SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
        [hashToken(token), tokenExpires, rows[0].id]
    );

    try {
        await enviarEmail({
            to: normalizedEmail,
            subject: 'Redefinição de senha',
            text: `Clique no link para redefinir sua senha:\n\n${APP_URL}/nova_senha/${token}\n\nO link vale por 1 hora. Se não foi você, ignore este email.`,
        });
    } catch (err) {
        console.error('Erro ao enviar email de redefinição:', err.message);
        return res.status(500).json({ error: 'Não foi possível enviar o email. Tente mais tarde.' });
    }
    res.json(resposta);
});

// POST - reset password
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { senha } = req.body || {};
    if (typeof senha !== 'string' || senha.length < SENHA_MIN) {
        return res.status(400).json({ error: `A senha precisa ter pelo menos ${SENHA_MIN} caracteres.` });
    }

    const { rows } = await db.query(
        'SELECT id FROM usuarios WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
        [hashToken(token)]
    );
    if (!rows.length) return res.status(400).json({ error: 'Token inválido ou expirado' });

    const hashedPassword = await bcrypt.hash(senha, 10);
    await db.query(
        'UPDATE usuarios SET senha = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
        [hashedPassword, rows[0].id]
    );

    res.json({ message: 'Senha redefinida com sucesso' });
});

// GET - pega usuário por ID
router.get('/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    // Próprio usuário ou professor com vínculo ativo
    if (!(await verificarVinculo(req, id))) {
        return res.status(403).json({ error: 'Acesso não autorizado.' });
    }
    const { rows } = await db.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    if (rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(limparUsuario(rows[0]));
});

// POST - cria novo usuário com avatar
router.post('/', upload.single('avatar'), async (req, res) => {
    const { nome, genero, senha, funcao, data_nascimento, telefone, altura, peso, objetivo } = req.body;
    const avatar = req.file ? req.file.path : null;
    const normalizedEmail = normalizarEmail(req.body.email);

    if (!nome || typeof nome !== 'string' || !nome.trim()) {
        return res.status(400).json({ error: 'Nome é obrigatório.' });
    }
    if (!EMAIL_RE.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Email inválido.' });
    }
    if (typeof senha !== 'string' || senha.length < SENHA_MIN) {
        return res.status(400).json({ error: `A senha precisa ter pelo menos ${SENHA_MIN} caracteres.` });
    }
    // Função é escolhida no cadastro, mas só entre os papéis públicos
    const funcaoFinal = FUNCOES.includes(funcao) ? funcao : 'Aluno';

    const existingUser = await db.query('SELECT 1 FROM usuarios WHERE email = $1', [normalizedEmail]);
    if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Email já cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    try {
        const resultado = await db.query(
            `INSERT INTO usuarios
            (nome, email, genero, senha, funcao, avatar, data_nascimento, telefone, altura, peso, objetivo)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING *`,
            [nome.trim(), normalizedEmail, genero, hashedPassword, funcaoFinal, avatar, data_nascimento || null, telefone || null, altura || null, peso || null, objetivo || null]
        );
        res.status(201).json(limparUsuario(resultado.rows[0]));
    } catch (err) {
        // Corrida entre dois cadastros com o mesmo email
        if (err.code === '23505') return res.status(400).json({ error: 'Email já cadastrado.' });
        throw err;
    }
});

// DELETE - remove usuário e todos os dados relacionados
router.delete('/:id', authenticate, requireSelf('id'), async (req, res) => {
    const { id } = req.params;

    const removido = await db.transaction(async (tx) => {
        // Séries, observações e treinos realizados
        await tx.query('DELETE FROM series_usuario WHERE usuario_id = $1', [id]);
        await tx.query(`
            DELETE FROM obs_exercicio
            WHERE treino_realizado_id IN (SELECT id FROM treinos_realizados WHERE usuario_id = $1)
        `, [id]);
        await tx.query('DELETE FROM treinos_realizados WHERE usuario_id = $1', [id]);

        // Exercícios dos treinos do usuário
        await tx.query(`
            DELETE FROM treinos_exercicios
            WHERE treino_id IN (SELECT id FROM treinos WHERE usuario_id = $1)
        `, [id]);
        await tx.query('DELETE FROM treinos WHERE usuario_id = $1', [id]);

        // Avaliações, cardio, vínculos, perfil de professor
        await tx.query('DELETE FROM avaliacoes_fisicas WHERE usuario_id = $1', [id]);
        await tx.query('DELETE FROM cardio_sessoes WHERE usuario_id = $1', [id]);
        await tx.query('DELETE FROM vinculos WHERE professor_id = $1 OR aluno_id = $1', [id]);
        await tx.query('DELETE FROM amizades WHERE solicitante_id = $1 OR destinatario_id = $1', [id]);
        await tx.query('DELETE FROM professores WHERE usuario_id = $1', [id]);

        // Água, gamificação e Hércules
        await tx.query('DELETE FROM agua_registros WHERE usuario_id = $1', [id]);
        await tx.query('DELETE FROM objetivos_progresso WHERE usuario_id = $1', [id]);
        await tx.query('DELETE FROM gamificacao_usuario WHERE usuario_id = $1', [id]);
        await tx.query('DELETE FROM hercules_mensagens WHERE usuario_id = $1', [id]);
        await tx.query('DELETE FROM hercules_conversas WHERE usuario_id = $1', [id]);

        // Mensagens (inclusive as recebidas nos chats do usuário) e chats
        await tx.query(`
            DELETE FROM mensagens
            WHERE remetente_id = $1
               OR chat_id IN (SELECT id FROM chats WHERE usuario1_id = $1 OR usuario2_id = $1)
        `, [id]);
        await tx.query('DELETE FROM chats WHERE usuario1_id = $1 OR usuario2_id = $1', [id]);

        // Push subscriptions
        await tx.query('DELETE FROM push_subscriptions WHERE usuario_id = $1', [id]);

        // Usuário (assinaturas caem por ON DELETE CASCADE)
        const resultado = await tx.query('DELETE FROM usuarios WHERE id = $1 RETURNING avatar', [id]);
        return resultado.rows[0] || null;
    });

    if (!removido) return res.status(404).json({ error: 'Usuário não encontrado' });
    await apagarAvatarCloudinary(removido.avatar);
    res.json({ ok: true });
});

// PUT - atualiza usuário
router.put('/:id', authenticate, requireSelf('id'), upload.single('avatar'), async (req, res) => {
    const { id } = req.params;
    const campos = [];
    const values = [];

    // Lista de campos que podem ser atualizados
    const permitidos = ['nome', 'email', 'genero', 'idade', 'data_nascimento', 'telefone', 'altura', 'peso', 'objetivo', 'nivel_experiencia', 'dias_disponiveis', 'tempo_sessao', 'local_treino', 'onboarding_concluido'];

    if (req.body.email !== undefined) {
        const email = normalizarEmail(req.body.email);
        if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Email inválido.' });
        const dono = await db.query('SELECT id FROM usuarios WHERE email = $1 AND id <> $2', [email, id]);
        if (dono.rows.length) return res.status(400).json({ error: 'Email já cadastrado.' });
        req.body.email = email;
    }

    // Monta a query apenas com os campos enviados no body
    for (const campo of permitidos) {
        if (req.body[campo] !== undefined) {
            values.push(req.body[campo]);
            campos.push(`${campo} = $${values.length}`);
        }
    }

    // senha só atualiza se vier preenchida
    if (req.body.senha) {
        if (String(req.body.senha).length < SENHA_MIN) {
            return res.status(400).json({ error: `A senha precisa ter pelo menos ${SENHA_MIN} caracteres.` });
        }
        values.push(await bcrypt.hash(String(req.body.senha), 10));
        campos.push(`senha = $${values.length}`);
    }

    // avatar só atualiza se houver upload
    if (req.file) {
        values.push(req.file.path);
        campos.push(`avatar = $${values.length}`);
    }

    if (campos.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo válido enviado para atualização' });
    }

    // Foto antiga, pra apagar do Cloudinary depois que a nova estiver salva
    const anterior = req.file
        ? await db.query('SELECT avatar FROM usuarios WHERE id = $1', [id])
        : null;

    values.push(id);
    const resultado = await db.query(
        `UPDATE usuarios SET ${campos.join(', ')} WHERE id = $${values.length} RETURNING *`,
        values
    );

    if (resultado.rowCount === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (anterior) await apagarAvatarCloudinary(anterior.rows[0]?.avatar);

    res.json({ message: 'Usuário atualizado com sucesso', usuario: limparUsuario(resultado.rows[0]) });
});

// DELETE - remove avatar do usuário
router.delete('/:id/avatar', authenticate, requireSelf('id'), async (req, res) => {
    const { id } = req.params;
    const anterior = await db.query('SELECT avatar FROM usuarios WHERE id = $1', [id]);
    const resultado = await db.query(
        'UPDATE usuarios SET avatar = NULL WHERE id = $1 RETURNING *',
        [id]
    );
    if (resultado.rowCount === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    await apagarAvatarCloudinary(anterior.rows[0]?.avatar);
    res.json({ message: 'Avatar removido com sucesso', usuario: limparUsuario(resultado.rows[0]) });
});

// PUT - define ou remove funcao_extra do usuário
router.put('/:id/funcao-extra', authenticate, requireSelf('id'), async (req, res) => {
    const { id } = req.params;
    const { funcao_extra } = req.body; // null para remover
    if (funcao_extra && !FUNCOES.includes(funcao_extra)) {
        return res.status(400).json({ error: 'Função inválida.' });
    }
    await db.query(
        'UPDATE usuarios SET funcao_extra = $1 WHERE id = $2',
        [funcao_extra || null, id]
    );
    res.json({ ok: true });
});

module.exports = router;
