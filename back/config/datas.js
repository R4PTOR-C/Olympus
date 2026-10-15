// Datas no fuso do Brasil.
//
// O servidor (Render) e o banco rodam em UTC. Sem isso, depois das 21h em
// Brasília "hoje" vira o dia seguinte: séries, água, streak e objetivos caíam
// no dia errado.

const FUSO = 'America/Sao_Paulo';

// 'YYYY-MM-DD' de hoje no fuso do Brasil
function hojeSP(agora = new Date()) {
    // en-CA formata como YYYY-MM-DD
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(agora);
}

// Dia da semana (0 = domingo) no fuso do Brasil
function diaSemanaSP(agora = new Date()) {
    const nome = new Intl.DateTimeFormat('en-US', { timeZone: FUSO, weekday: 'short' }).format(agora);
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(nome);
}

// Expressões SQL equivalentes, para usar no lugar de CURRENT_DATE.
const SQL_HOJE = `(NOW() AT TIME ZONE '${FUSO}')::date`;
const SQL_INICIO_SEMANA = `date_trunc('week', ${SQL_HOJE})::date`;

// Data (no fuso do Brasil) de uma coluna de timestamp. O cast para timestamptz
// funciona tanto para colunas com fuso quanto sem (gravadas em UTC).
// NÃO usar em colunas do tipo date.
const sqlDiaSP = (coluna) => `((${coluna})::timestamptz AT TIME ZONE '${FUSO}')::date`;

module.exports = { FUSO, hojeSP, diaSemanaSP, SQL_HOJE, SQL_INICIO_SEMANA, sqlDiaSP };
