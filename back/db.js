require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 5432,
    // Render exige SSL; o Postgres local (olympus_dev) não usa
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Erro numa conexão ociosa não pode derrubar o processo
pool.on('error', (err) => {
    console.error('Erro inesperado no pool do PostgreSQL:', err.message);
});

// Executa `fn` dentro de uma transação, com todas as queries no MESMO client.
// (BEGIN/COMMIT via pool.query não funciona: cada query pode ir para uma
// conexão diferente.) `fn` recebe um objeto com a mesma interface `query`.
async function transaction(fn) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
    } finally {
        client.release();
    }
}

module.exports = {
    query: (text, params) => pool.query(text, params),
    transaction,
    pool,
};
