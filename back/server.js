const express = require('express');
const session = require('express-session');
const cors = require('cors');
const loginRouter = require('./login/login'); // Importa o módulo de login
const usuariosRouter = require('./usuarios'); // Importa o módulo de usuários
const academiaRouter = require('./academias');

const app = express();
const PORT = 5000;

// Configurações de Middleware
app.use(cors({
    credentials: true,
    origin: 'http://localhost:3000' // Ajuste conforme necessário
}));

app.use(express.json());

app.use(session({
    secret: 'seu_segredo_aqui',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Em produção, use secure: true e use HTTPS
}));

// Middleware para verificar se o usuário está autenticado
function checkAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(401).json({ error: 'Não autorizado' });
}

// Usar as rotas de login
app.use('/', loginRouter);

// Usar as rotas de usuários
app.use('/usuarios', usuariosRouter);

app.use('/academias', academiaRouter);

// Exemplo de uma rota protegida
app.get('/home', checkAuthenticated, (req, res) => {
    res.json({ message: 'Você está logado e pode ver isso!' });
});

app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});
