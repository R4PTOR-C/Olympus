const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const usuariosRouter = require('./usuarios'); // Ajuste o caminho conforme necessário
const loginRouter = require('./login/usuarios_login');
const academiaRouter = require('./academias/academias');
const exerciciosRouter = require('./exercicios');
const treinosRouter = require('./treinos'); // Importa o módulo de treinos

const app = express();
const PORT = process.env.PORT || 5000;

// Configurações de Middleware
app.use(cors({
    credentials: true,
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:19000'] // Array de strings para múltiplas origens
}));

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' } // Secure cookies em produção
}));

// Rotas de API
app.use('/usuarios', usuariosRouter);
app.use('/', loginRouter);
app.use('/academias', academiaRouter);
app.use('/exercicios', exerciciosRouter);
app.use('/treinos', treinosRouter);

// Middleware para verificar se o usuário está autenticado
function checkAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(401).json({ error: 'Não autorizado' });
}

// Rotas protegidas
app.get('/home', checkAuthenticated, (req, res) => {
    res.json({ message: 'Você está logado e pode ver isso!' });
});

// Serve arquivos estáticos do build do React
app.use(express.static(path.join(__dirname, 'build')));

// Rota catch-all para enviar o index.html para qualquer rota desconhecida
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});
