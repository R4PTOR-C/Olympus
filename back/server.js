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
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'https://olympus-33lb.onrender.com']
}));


app.use(express.json());

app.set('trust proxy', 1); // Necessário para HTTPS e cookies com 'secure' em proxy
app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true apenas em produção com HTTPS
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' para produção, 'lax' para desenvolvimento
    }
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

// Serve os arquivos estáticos do frontend a partir da pasta correta (front/build)
app.use(express.static(path.join(__dirname, '../front/build')));

// Catch-all route to serve index.html for React Router
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../front/build', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});
