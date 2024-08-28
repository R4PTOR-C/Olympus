const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const usuariosRouter = require('./usuarios'); // Ajuste o caminho conforme necessário
const loginRouter = require('./login/login');
const academiaRouter = require('./academias');

const app = express();
const PORT = process.env.PORT || 5000;

// Configurações de Middleware
app.use(cors({
    credentials: true,
    origin: process.env.FRONTEND_URL || 'http://localhost:3000' // Ajuste conforme necessário
}));

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' } // Secure cookies in production
}));

// Rotas
app.use('/usuarios', usuariosRouter); // Adiciona o roteador de usuários
app.use('/', loginRouter); // Adiciona o roteador de login
app.use('/academias', academiaRouter); // Adiciona o roteador de academias

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

// Serve arquivos estáticos (opcional, se estiver servindo um frontend estático)
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});
