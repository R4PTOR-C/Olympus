require("dotenv").config(); // Carrega variáveis do .env
console.log("API KEY carregada?", process.env.OPENAI_API_KEY ? "✅ sim" : "❌ não");

const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const http = require("http"); // 🔹 Necessário pro Socket.IO
const { Server } = require("socket.io"); // 🔹 Importa o socket.io
const db = require("./db"); // Banco de dados para salvar mensagens

// 🔹 Rotas HTTP (REST)
const usuariosRouter = require("./usuarios");
const loginRouter = require("./login/usuarios_login");
const academiaRouter = require("./academias/academias");
const exerciciosRouter = require("./exercicios");
const treinosRouter = require("./treinos");
const avaliacoesRouter = require("./avaliacoes");
const herculesRouter = require("./hercules");
const professoresRouter = require("./professores");
const chatsRouter   = require("./chats");
const vinculosRouter = require("./vinculos");
const pushRouter    = require("./push");
const cardioRouter  = require("./cardio");
const aguaRouter         = require("./agua");
const gamificacaoRouter  = require("./gamificacao");

// 🔹 Módulo separado para eventos de chat em tempo real
const chatSocket = require("./socket/chatSocket");

const app = express();
const server = http.createServer(app); // Cria o servidor HTTP
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "seu_jwt_secret";

// 🔹 Configuração do Socket.IO
const io = new Server(server, {
    cors: {
        origin: [
            process.env.FRONTEND_URL || "http://localhost:3000",
            "https://olympus-33lb.onrender.com"
        ],
        methods: ["GET", "POST"]
    }
});

// Passa a instância do io e db pro módulo de chat
chatSocket(io, db);

// ------------------- MIDDLEWARES -------------------

// Disponibiliza io em todas as rotas via req.io
app.use((req, res, next) => { req.io = io; next(); });

app.use(cors({
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    origin: [
        process.env.FRONTEND_URL || "http://localhost:3000",
        "https://olympus-33lb.onrender.com"
    ]
}));

app.use(express.json());

// Middleware para autenticação JWT
function checkAuthenticated(req, res, next) {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Token não fornecido" });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: "Token inválido" });
        }
        req.user = decoded;
        next();
    });
}

// ------------------- ROTAS REST -------------------

app.use("/usuarios", usuariosRouter);
app.use("/", loginRouter);
app.use("/academias", academiaRouter);
app.use("/exercicios", exerciciosRouter);
app.use("/treinos", treinosRouter);
app.use("/avaliacoes", avaliacoesRouter);
app.use("/hercules", herculesRouter);
app.use("/professores", professoresRouter);
app.use("/chat",    chatsRouter);
app.use("/vinculos", vinculosRouter);
app.use("/push",    pushRouter);
app.use("/cardio",  cardioRouter);
app.use("/agua",         aguaRouter);
app.use("/gamificacao",  gamificacaoRouter);

// ------------------- ROTAS PROTEGIDAS -------------------

app.get("/home", checkAuthenticated, (req, res) => {
    res.json({ message: "Você está logado e pode ver isso!", user: req.user });
});

// ------------------- ARQUIVOS ESTÁTICOS -------------------

// Frontend React build
app.use(express.static(path.join(__dirname, "../front/build")));

// Uploads (imagens de avatar, etc.)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Catch-all route para React Router
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../front/build", "index.html"));
});

// ------------------- INICIALIZAÇÃO -------------------

server.listen(PORT, () => {
    console.log(`🚀 Servidor backend rodando na porta ${PORT}`);
});
