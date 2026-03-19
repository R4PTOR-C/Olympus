const jwt = require('jsonwebtoken');
const db  = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

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

// Middleware: exige que o professor tenha vínculo ativo com o aluno
// O id do aluno vem de req.params[paramName]
function requireVinculo(paramName = 'usuarioId') {
    return async (req, res, next) => {
        try {
            const { userId, userFuncao } = req.user;
            const targetId = parseInt(req.params[paramName]);

            // Próprio usuário sempre pode acessar seus dados
            if (parseInt(userId) === targetId) return next();

            // Professor precisa ter vínculo ativo (funcao principal ou extra)
            const isProfessor = userFuncao === 'Professor' || req.user.userFuncaoExtra === 'Professor';
            if (isProfessor) {
                const { rows } = await db.query(
                    `SELECT id FROM vinculos
                     WHERE professor_id = $1 AND aluno_id = $2 AND status = 'ativo'`,
                    [userId, targetId]
                );
                if (rows.length) return next();
            }

            return res.status(403).json({ error: 'Acesso não autorizado.' });
        } catch {
            return res.status(500).json({ error: 'Erro interno.' });
        }
    };
}

// Helper usado dentro de handlers quando o alunoId vem do banco (ex: via treinoId)
async function verificarVinculo(req, alunoId) {
    const { userId, userFuncao } = req.user;
    if (parseInt(userId) === parseInt(alunoId)) return true;
    const isProfessor = userFuncao === 'Professor' || req.user?.userFuncaoExtra === 'Professor';
    if (isProfessor) {
        const { rows } = await db.query(
            `SELECT id FROM vinculos
             WHERE professor_id = $1 AND aluno_id = $2 AND status = 'ativo'`,
            [userId, alunoId]
        );
        return rows.length > 0;
    }
    return false;
}

module.exports = { authenticate, requireVinculo, verificarVinculo };
