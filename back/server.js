const express = require('express');
const session = require('express-session');
const cors = require('cors');
const loginRouter = require('./login/login');
const usuariosRouter = require('./usuarios');
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

// Middleware para verificar se o usuário está autenticado
function checkAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(401).json({ error: 'Não autorizado' });
}

app.use('/', loginRouter);
app.use('/usuarios', usuariosRouter);
app.use('/academias', academiaRouter);

app.get('/home', checkAuthenticated, (req, res) => {
    res.json({ message: 'Você está logado e pode ver isso!' });
});

app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});
