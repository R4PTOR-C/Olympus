const express = require('express');
const db = require('./db');
const bcrypt = require('bcrypt');
const session = require('express-session');  // Adicionando o pacote de sessão
const app = express();
const PORT = 5000;
const cors = require('cors');

// Configurações de Middleware
app.use(cors({
    credentials: true,
    origin: 'http://localhost:3000'  // Ajuste conforme necessário
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

// Rota de login
// Rota de login
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const { rows } = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        const user = rows[0];
        const senhaValida = await bcrypt.compare(senha, user.senha);
        if (!senhaValida) {
            return res.status(401).json({ error: 'Senha incorreta' });
        }
        // Armazena o ID e o nome do usuário na sessão
        req.session.userId = user.id;
        req.session.userName = user.nome; // Adiciona o nome do usuário na sessão
        res.json({ message: 'Login bem-sucedido', userName: user.nome });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Rota para verificar a sessão do usuário
app.get('/session', (req, res) => {
    if (req.session.userId) {
        res.json({ loggedIn: true, userName: req.session.userName });
    } else {
        res.json({ loggedIn: false });
    }
});




// Exemplo de uma rota protegida
app.get('/home', checkAuthenticated, (req, res) => {
    res.json({ message: 'Você está logado e pode ver isso!' });
});


app.get('/usuarios', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM usuarios');
        console.log(rows); // Imprime os dados na console do servidor
        res.json(rows); // Envia os dados como JSON para o cliente
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Internal server error'});
    }
});

app.post('/usuarios', async (req, res) => {
    const { nome, email, genero, idade, senha } = req.body;

    try {
        // Gerar um hash da senha
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(senha, saltRounds);

        // Inserir o usuário com a senha hash no banco de dados
        const resultado = await db.query(
            'INSERT INTO usuarios (nome, email, genero, idade, senha) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nome, email, genero, idade, hashedPassword]
        );
        res.status(201).json(resultado.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});
