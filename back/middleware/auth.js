const jwt = require('jsonwebtoken');
const db  = require('../db');
const { JWT_SECRET } = require('../config/jwt');

// Verifica JWT e popula req.user
function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Não autenticado.' });
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Token inválido.' });
        req.user = decoded;
        next();
    });
}

const mesmoId = (a, b) => a != null && b != null && parseInt(a) === parseInt(b);

// O id informado é o do próprio usuário autenticado?
const ehProprioUsuario = (req, id) => mesmoId(req.user?.userId, id);

// Administradores: ids listados em ADMIN_USER_IDS (ex: "1,7")
function ehAdmin(req) {
    const ids = (process.env.ADMIN_USER_IDS || '')
        .split(',').map(s => parseInt(s.trim())).filter(Number.isInteger);
    return ids.includes(parseInt(req.user?.userId));
}

function requireAdmin(req, res, next) {
    if (!ehAdmin(req)) return res.status(403).json({ error: 'Acesso restrito a administradores.' });
    next();
}

// Middleware: o id em req.params[paramName] precisa ser o próprio usuário
function requireSelf(paramName) {
    return (req, res, next) => {
        if (!ehProprioUsuario(req, req.params[paramName])) {
            return res.status(403).json({ error: 'Acesso não autorizado.' });
        }
        next();
    };
}

const ehProfessor = (req) =>
    req.user?.userFuncao === 'Professor' || req.user?.userFuncaoExtra === 'Professor';

// Próprio usuário, ou professor com vínculo ativo com ele
async function verificarVinculo(req, alunoId) {
    if (ehProprioUsuario(req, alunoId)) return true;
    if (!ehProfessor(req)) return false;
    const { rows } = await db.query(
        `SELECT id FROM vinculos
         WHERE professor_id = $1 AND aluno_id = $2 AND status = 'ativo'`,
        [req.user.userId, alunoId]
    );
    return rows.length > 0;
}

// Middleware: exige que o professor tenha vínculo ativo com o aluno
// O id do aluno vem de req.params[paramName]
function requireVinculo(paramName = 'usuarioId') {
    return async (req, res, next) => {
        try {
            if (await verificarVinculo(req, req.params[paramName])) return next();
            return res.status(403).json({ error: 'Acesso não autorizado.' });
        } catch (err) {
            next(err);
        }
    };
}

// Helper: existe amizade aceita entre dois usuários?
async function saoAmigos(userIdA, userIdB) {
    const { rows } = await db.query(
        `SELECT 1 FROM amizades
         WHERE status = 'aceito'
           AND ((solicitante_id = $1 AND destinatario_id = $2)
             OR (solicitante_id = $2 AND destinatario_id = $1))`,
        [userIdA, userIdB]
    );
    return rows.length > 0;
}

// Existe bloqueio entre dois usuários, em qualquer sentido? Bloqueio impede
// contato nos dois sentidos (mensagem, amizade, conexão professor ↔ aluno).
async function existeBloqueio(userIdA, userIdB) {
    const { rows } = await db.query(
        `SELECT 1 FROM bloqueios
         WHERE (bloqueador_id = $1 AND bloqueado_id = $2)
            OR (bloqueador_id = $2 AND bloqueado_id = $1)
         LIMIT 1`,
        [userIdA, userIdB]
    );
    return rows.length > 0;
}

// Trecho de SQL para tirar de listagens os usuários bloqueados (nos dois
// sentidos). `colunaUsuario` = coluna com o id listado; `param` = $n do usuário logado.
const SQL_SEM_BLOQUEIO = (colunaUsuario, param) => `NOT EXISTS (
    SELECT 1 FROM bloqueios bl
    WHERE (bl.bloqueador_id = ${param} AND bl.bloqueado_id = ${colunaUsuario})
       OR (bl.bloqueador_id = ${colunaUsuario} AND bl.bloqueado_id = ${param})
)`;

// Contas de teste em produção (usuarios.conta_teste): só aparecem para outras
// contas de teste; contas de teste veem todo mundo. Mesmos parâmetros do
// SQL_SEM_BLOQUEIO.
const SQL_VISIVEL = (colunaUsuario, param) => `(
    NOT (SELECT conta_teste FROM usuarios WHERE id = ${colunaUsuario})
    OR (SELECT conta_teste FROM usuarios WHERE id = ${param})
)`;

// Conta de teste e conta real não se conectam (vínculo, amizade), em nenhum sentido
async function mundosDiferentes(userIdA, userIdB) {
    const { rows } = await db.query(
        'SELECT COUNT(DISTINCT conta_teste)::int AS n FROM usuarios WHERE id IN ($1, $2)',
        [userIdA, userIdB]
    );
    return rows[0].n > 1;
}

// Carrega um treino e verifica o acesso.
//   modo 'escrita' → dono ou professor vinculado
//   modo 'leitura' → também amigos aceitos (podem ver e copiar)
// Responde 404/403 e devolve null quando não pode.
async function autorizarTreino(req, res, treinoId, modo = 'escrita') {
    const { rows } = await db.query('SELECT * FROM treinos WHERE id = $1', [treinoId]);
    if (!rows.length) {
        res.status(404).json({ error: 'Treino não encontrado' });
        return null;
    }
    const treino = rows[0];
    if (await verificarVinculo(req, treino.usuario_id)) return treino;
    if (modo === 'leitura' && await saoAmigos(req.user.userId, treino.usuario_id)) return treino;
    res.status(403).json({ error: 'Acesso não autorizado.' });
    return null;
}

// Mesmo esquema para uma sessão de treino (treinos_realizados)
async function autorizarTreinoRealizado(req, res, id) {
    const { rows } = await db.query('SELECT * FROM treinos_realizados WHERE id = $1', [id]);
    if (!rows.length) {
        res.status(404).json({ error: 'Treino realizado não encontrado.' });
        return null;
    }
    if (!(await verificarVinculo(req, rows[0].usuario_id))) {
        res.status(403).json({ error: 'Acesso não autorizado.' });
        return null;
    }
    return rows[0];
}

module.exports = {
    authenticate,
    requireAdmin,
    requireSelf,
    requireVinculo,
    verificarVinculo,
    saoAmigos,
    existeBloqueio,
    SQL_SEM_BLOQUEIO,
    SQL_VISIVEL,
    mundosDiferentes,
    ehAdmin,
    ehProprioUsuario,
    autorizarTreino,
    autorizarTreinoRealizado,
};
