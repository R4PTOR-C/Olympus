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
    const { senha, reset_password_token, reset_password_expires, email_token, email_token_expires, ...resto } = u;
    return resto;
};

const normalizarEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');

// O token de reset é guardado só como hash: quem ler o banco não consegue usá-lo
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// ── Confirmação de email ──
// Um único token por usuário: confirma o email do cadastro ou, se houver
// email_pendente, efetiva a troca. Vale 24h; guardado só como hash.
const EMAIL_TOKEN_VALIDADE_MS = 24 * 3600000;
const REENVIO_INTERVALO_MS = 60000;

const novoTokenEmail = () => {
    const token = crypto.randomBytes(32).toString('hex');
    return { token, hash: hashToken(token), expira: new Date(Date.now() + EMAIL_TOKEN_VALIDADE_MS) };
};

// Chamado sem await: o Gmail leva segundos e a resposta não depende dele.
// Falha no envio não desfaz cadastro/troca: o usuário pode pedir reenvio.
const enviarConfirmacaoEmail = async (to, token, troca) => {
    try {
        await enviarEmail({
            to,
            subject: troca ? 'Confirme seu novo email' : 'Confirme seu email',
            text: (troca
                ? 'Você pediu para usar este email na sua conta Atlanteon. Confirme pelo link abaixo:'
                : 'Bem-vindo ao Atlanteon! Confirme seu email pelo link abaixo:')
                + `\n\n${APP_URL}/confirmar-email/${token}\n\nO link vale por 24 horas. Se não foi você, ignore este email.`,
        });
    } catch (err) {
        console.error('Erro ao enviar email de confirmação:', err.message);
    }
};

// "fulano@gmail.com" → "f*****@gmail.com"
const mascararEmail = (email) => email.replace(/^(.)[^@]*/, (_, c) => c + '*****');

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

// POST - confirma o email (cadastro) ou efetiva a troca para o email pendente.
// Público: quem clica no link pode não estar logado naquele navegador.
router.post('/confirmar-email/:token', async (req, res) => {
    const { rows } = await db.query(
        `SELECT id, email, email_pendente FROM usuarios
         WHERE email_token = $1 AND email_token_expires > NOW()`,
        [hashToken(String(req.params.token))]
    );
    if (!rows.length) {
        return res.status(400).json({ error: 'Link inválido ou expirado. Peça um novo no app.' });
    }
    const u = rows[0];

    if (!u.email_pendente) {
        await db.query(
            'UPDATE usuarios SET email_verificado = true, email_token = NULL, email_token_expires = NULL WHERE id = $1',
            [u.id]
        );
        return res.json({ ok: true, email: u.email });
    }

    try {
        await db.query(
            `UPDATE usuarios SET email = email_pendente, email_pendente = NULL, email_verificado = true,
                    email_token = NULL, email_token_expires = NULL
             WHERE id = $1`,
            [u.id]
        );
    } catch (err) {
        // Alguém se cadastrou com esse email enquanto a troca esperava confirmação
        if (err.code === '23505') {
            await db.query('UPDATE usuarios SET email_pendente = NULL, email_token = NULL, email_token_expires = NULL WHERE id = $1', [u.id]);
            return res.status(400).json({ error: 'Esse email passou a ser usado por outra conta. A troca foi cancelada.' });
        }
        throw err;
    }

    // Avisa o email antigo: se não foi o dono, ele fica sabendo na hora
    try {
        await enviarEmail({
            to: u.email,
            subject: 'O email da sua conta foi alterado',
            text: `O email da sua conta Atlanteon foi alterado para ${mascararEmail(u.email_pendente)}.\n\nSe não foi você, responda este email para recuperarmos sua conta.`,
        });
    } catch (err) {
        console.error('Erro ao avisar email antigo:', err.message);
    }
    res.json({ ok: true, email: u.email_pendente });
});

// POST - reenvia o link de confirmação (do cadastro ou da troca pendente)
router.post('/:id/reenviar-confirmacao', authenticate, requireSelf('id'), async (req, res) => {
    const { rows } = await db.query(
        'SELECT email, email_pendente, email_verificado, email_token_expires FROM usuarios WHERE id = $1',
        [req.params.id]
    );
    const u = rows[0];
    if (!u) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (u.email_verificado && !u.email_pendente) {
        return res.status(400).json({ error: 'Seu email já está confirmado.' });
    }
    // O último token foi criado em (expira - validade): segura reenvios seguidos
    const criadoEm = u.email_token_expires ? new Date(u.email_token_expires).getTime() - EMAIL_TOKEN_VALIDADE_MS : 0;
    if (Date.now() - criadoEm < REENVIO_INTERVALO_MS) {
        return res.status(429).json({ error: 'Aguarde um minuto para pedir outro email.' });
    }

    const confirmacao = novoTokenEmail();
    await db.query(
        'UPDATE usuarios SET email_token = $1, email_token_expires = $2 WHERE id = $3',
        [confirmacao.hash, confirmacao.expira, req.params.id]
    );
    enviarConfirmacaoEmail(u.email_pendente || u.email, confirmacao.token, Boolean(u.email_pendente));
    res.json({ ok: true, email: u.email_pendente || u.email });
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
        // Abrir o link do email prova que o email é dele
        'UPDATE usuarios SET senha = $1, reset_password_token = NULL, reset_password_expires = NULL, email_verificado = true WHERE id = $2',
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
    const confirmacao = novoTokenEmail();

    try {
        const resultado = await db.query(
            `INSERT INTO usuarios
            (nome, email, genero, senha, funcao, avatar, data_nascimento, telefone, altura, peso, objetivo,
             email_verificado, email_token, email_token_expires)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,false,$12,$13)
            RETURNING *`,
            [nome.trim(), normalizedEmail, genero, hashedPassword, funcaoFinal, avatar, data_nascimento || null, telefone || null, altura || null, peso || null, objetivo || null,
             confirmacao.hash, confirmacao.expira]
        );
        enviarConfirmacaoEmail(normalizedEmail, confirmacao.token, false);
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
    // Email não entra aqui: a troca só vale depois de confirmada (ver abaixo)
    const permitidos = ['nome', 'genero', 'idade', 'data_nascimento', 'telefone', 'altura', 'peso', 'objetivo', 'nivel_experiencia', 'dias_disponiveis', 'tempo_sessao', 'local_treino', 'onboarding_concluido'];

    const atual = await db.query('SELECT email, senha FROM usuarios WHERE id = $1', [id]);
    if (!atual.rows.length) return res.status(404).json({ error: 'Usuário não encontrado' });

    let novoEmail = null;
    if (req.body.email !== undefined) {
        const email = normalizarEmail(req.body.email);
        if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Email inválido.' });
        if (email !== atual.rows[0].email) {
            const dono = await db.query('SELECT id FROM usuarios WHERE email = $1 AND id <> $2', [email, id]);
            if (dono.rows.length) return res.status(400).json({ error: 'Email já cadastrado.' });
            novoEmail = email;
        }
    }

    // Trocar email ou senha exige a senha atual: protege quem deixa o celular desbloqueado
    if (novoEmail || req.body.senha) {
        const senhaAtual = typeof req.body.senha_atual === 'string' ? req.body.senha_atual : '';
        if (!senhaAtual) return res.status(400).json({ error: 'Informe sua senha atual.' });
        if (!(await bcrypt.compare(senhaAtual, atual.rows[0].senha))) {
            return res.status(400).json({ error: 'Senha atual incorreta.' });
        }
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

    // Novo email fica pendente até o clique no link enviado para ele
    let confirmacao = null;
    if (novoEmail) {
        confirmacao = novoTokenEmail();
        values.push(novoEmail, confirmacao.hash, confirmacao.expira);
        campos.push(
            `email_pendente = $${values.length - 2}`,
            `email_token = $${values.length - 1}`,
            `email_token_expires = $${values.length}`
        );
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
    if (confirmacao) enviarConfirmacaoEmail(novoEmail, confirmacao.token, true);

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
