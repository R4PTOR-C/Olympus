const { Pool } = require('pg');

const pool = new Pool({
    user: 'olympus_postgresql_user', // usuário do banco de dados remoto
    host: 'dpg-cqmd44rqf0us73aae290-a.oregon-postgres.render.com', // host do banco de dados remoto
    database: 'olympus_postgresql_q26f', // nome do banco de dados remoto
    password: '7xaZM4UKyPyZZY5EIvLXtrNBuXJ7xjA9', // senha do banco de dados remoto
    port: 5432, // a porta em que o seu banco de dados remoto está rodando
    ssl: {
        rejectUnauthorized: false // necessário se o servidor requer SSL, mas o certificado é auto-assinado ou não confiável
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};

