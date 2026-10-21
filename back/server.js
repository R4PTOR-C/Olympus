require("dotenv").config(); // Carrega variáveis do .env
// Faz o Express 4 encaminhar erros de handlers async para o error handler,
// em vez de virarem unhandled rejection (que derruba o processo no Node ≥ 15).
require("express-async-errors");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const http = require("http"); // 🔹 Necessário pro Socket.IO
const { Server } = require("socket.io"); // 🔹 Importa o socket.io
const db = require("./db"); // Banco de dados para salvar mensagens

// 🔹 Rotas HTTP (REST)
const usuariosRouter = require("./usuarios");
const loginRouter = require("./login/usuarios_login");
const exerciciosRouter = require("./exercicios");
const treinosRouter = require("./treinos");
const avaliacoesRouter = require("./avaliacoes");
const herculesRouter = require("./hercules");
const professoresRouter = require("./professores");
const chatsRouter   = require("./chats");
const vinculosRouter = require("./vinculos");
const amizadesRouter = require("./amizades");
const pushRouter    = require("./push");
const cardioRouter  = require("./cardio");
const aguaRouter         = require("./agua");
const gamificacaoRouter  = require("./gamificacao");
const assinaturasRouter  = require("./assinaturas");
const moderacaoRouter    = require("./moderacao");

// 🔹 Módulo separado para eventos de chat em tempo real
const chatSocket = require("./socket/chatSocket");

const app = express();
const server = http.createServer(app); // Cria o servidor HTTP
const PORT = process.env.PORT || 5000;

// Origens permitidas (web + app Capacitor, que roda em https://localhost)
const ORIGENS = [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "https://atlanteontraining.com.br",
    "https://www.atlanteontraining.com.br",
    "https://olympus-33lb.onrender.com",
    "https://localhost"
];

// 🔹 Configuração do Socket.IO
const io = new Server(server, {
    cors: { origin: ORIGENS, methods: ["GET", "POST"] }
});

// Passa a instância do io e db pro módulo de chat
chatSocket(io, db);

// ------------------- MIDDLEWARES -------------------

// O Render fica atrás de um proxy: necessário para o rate limit ver o IP real
app.set("trust proxy", 1);

app.use(helmet({
    // O build do React usa imagens/vídeos do Cloudinary e scripts inline no
    // index.html; uma CSP precisaria ser montada à mão para não quebrar a tela.
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Disponibiliza io em todas as rotas via req.io
app.use((req, res, next) => { req.io = io; next(); });

app.use(cors({
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    origin: ORIGENS
}));

app.use(express.json({ limit: "1mb" }));

// Rate limit nas rotas sensíveis a força bruta / custo
const limitarAuth = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Muitas tentativas. Tente novamente em alguns minutos." },
});
const limitarHercules = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { erro: "Muitas mensagens seguidas. Aguarde um pouco." },
});

app.use("/login", limitarAuth);
app.use("/usuarios/forgot-password", limitarAuth);
app.use("/usuarios/reset-password", limitarAuth);
app.post("/usuarios", limitarAuth);
app.use("/hercules/chat", limitarHercules);

// ------------------- ROTAS REST -------------------

app.use("/usuarios", usuariosRouter);
app.use("/", loginRouter);
app.use("/exercicios", exerciciosRouter);
app.use("/treinos", treinosRouter);
app.use("/avaliacoes", avaliacoesRouter);
app.use("/hercules", herculesRouter);
app.use("/professores", professoresRouter);
app.use("/chat",    chatsRouter);
app.use("/vinculos", vinculosRouter);
app.use("/amizades", amizadesRouter);
app.use("/push",    pushRouter);
app.use("/cardio",  cardioRouter);
app.use("/agua",         aguaRouter);
app.use("/gamificacao",  gamificacaoRouter);
app.use("/assinaturas",  assinaturasRouter);
app.use("/moderacao",    moderacaoRouter);

// ------------------- ARQUIVOS ESTÁTICOS -------------------

// Frontend React build
app.use(express.static(path.join(__dirname, "../front/build")));

// Uploads (imagens dos grupos musculares, etc.)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Catch-all route para React Router
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../front/build", "index.html"));
});

// ------------------- TRATAMENTO DE ERROS -------------------

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    // JSON malformado no body
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ error: "JSON inválido." });
    }
    // Erros de entrada do Postgres (id não numérico, data inválida, FK inexistente…)
    if (["22P02", "22007", "22008", "23503", "23502"].includes(err.code)) {
        return res.status(400).json({ error: "Dados inválidos." });
    }
    console.error(`Erro em ${req.method} ${req.originalUrl}:`, err);
    if (res.headersSent) return;
    res.status(500).json({ error: "Erro interno do servidor" });
});

process.on("unhandledRejection", (err) => {
    console.error("Promise rejeitada sem tratamento:", err);
});

// ------------------- INICIALIZAÇÃO -------------------

server.listen(PORT, () => {
    console.log(`🚀 Servidor backend rodando na porta ${PORT}`);
});
