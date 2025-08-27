require("dotenv").config(); // <-- carrega variáveis do .env
console.log("API KEY carregada?", process.env.OPENAI_API_KEY ? "✅ sim" : "❌ não");

const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const usuariosRouter = require('./usuarios'); // Ajuste o caminho conforme necessário
const loginRouter = require('./login/usuarios_login');
const academiaRouter = require('./academias/academias');
const exerciciosRouter = require('./exercicios');
const treinosRouter = require('./treinos'); // Importa o módulo de treinos
const avaliacoesRouter = require('./avaliacoes');
const herculesRouter = require("./hercules");


const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'seu_jwt_secret';

// Configurações de Middleware
app.use(cors({
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'], // Defina explicitamente os cabeçalhos necessários
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'https://olympus-33lb.onrender.com']
}));

app.use(express.json());

// Middleware para verificar se o usuário está autenticado
function checkAuthenticated(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1]; // Pega o token do cabeçalho Authorization
    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Token inválido' });
        }
        req.user = decoded; // Armazena os dados decodificados no request para uso posterior
        next();
    });
}

// Rotas de API
app.use('/usuarios', usuariosRouter);
app.use('/', loginRouter);
app.use('/academias', academiaRouter);
app.use('/exercicios', exerciciosRouter);
app.use('/treinos', treinosRouter);
app.use('/avaliacoes', avaliacoesRouter);
app.use('/hercules', herculesRouter);


// Rotas protegidas
app.get('/home', checkAuthenticated, (req, res) => {
    res.json({ message: 'Você está logado e pode ver isso!', user: req.user });
});

// Serve os arquivos estáticos do frontend a partir da pasta correta (front/build)
app.use(express.static(path.join(__dirname, '../front/build')));

// Servir a pasta uploads como estática
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Catch-all route to serve index.html for React Router
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../front/build', 'index.html'));
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});
