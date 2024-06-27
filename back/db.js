const { Pool } = require('pg');

const pool = new Pool({
    user: 'olympus_postgresql_user', // usuário do banco de dados remoto
    host: 'dpg-cptd8sg8fa8c73b7ol70-a.oregon-postgres.render.com', // host do banco de dados remoto
    database: 'olympus_postgresql', // nome do banco de dados remoto
    password: 'xhYvhSaZ7ZmOqQCaSShIL80GKIMUxJDe', // senha do banco de dados remoto
    port: 5432, // a porta em que o seu banco de dados remoto está rodando
    ssl: {
        rejectUnauthorized: false // necessário se o servidor requer SSL, mas o certificado é auto-assinado ou não confiável
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};

