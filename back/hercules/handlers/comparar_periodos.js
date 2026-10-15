const { hojeSP } = require('../../config/datas');

async function handleCompararPeriodos({ args, usuarioId, pool }) {
    const { periodo1, periodo2 } = args;

    const resolverPeriodo = (periodo) => {
        // "Hoje" no fuso do Brasil, representado como meia-noite UTC; todas as
        // contas usam métodos UTC para não depender do fuso do servidor.
        const hoje = new Date(`${hojeSP()}T00:00:00Z`);
        const fmt = (d) => d.toISOString().split('T')[0];
        const diasAtras = (d, n) => { const r = new Date(d); r.setUTCDate(r.getUTCDate() - n); return r; };
        const segundaDaSemana = diasAtras(hoje, (hoje.getUTCDay() + 6) % 7);

        switch (periodo) {
            case 'esta_semana':
                return { inicio: fmt(segundaDaSemana), fim: fmt(hoje), label: 'Esta semana' };
            case 'semana_passada': {
                const seg = diasAtras(segundaDaSemana, 7);
                return { inicio: fmt(seg), fim: fmt(diasAtras(seg, -6)), label: 'Semana passada' };
            }
            case 'este_mes': {
                const ini = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1));
                return { inicio: fmt(ini), fim: fmt(hoje), label: 'Este mês' };
            }
            case 'mes_passado': {
                const ini = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - 1, 1));
                const fim = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 0));
                return { inicio: fmt(ini), fim: fmt(fim), label: 'Mês passado' };
            }
            case 'ultimas_4_semanas':
                return { inicio: fmt(diasAtras(hoje, 28)), fim: fmt(hoje), label: 'Últimas 4 semanas' };
            case 'ultimas_8_semanas':
                return { inicio: fmt(diasAtras(hoje, 56)), fim: fmt(hoje), label: 'Últimas 8 semanas' };
            default:
                // Aceita objeto { inicio, fim } direto
                if (periodo?.inicio && periodo?.fim) return { ...periodo, label: `${periodo.inicio} a ${periodo.fim}` };
                return null;
        }
    };

    const p1 = resolverPeriodo(periodo1);
    const p2 = resolverPeriodo(periodo2);

    if (!p1 || !p2) return { sucesso: false, erro: 'Períodos inválidos.' };

    const queryPeriodo = async (inicio, fim) => {
        const [volumeRes, diasRes, cargaRes, cardioRes] = await Promise.all([
            pool.query(
                `SELECT e.grupo_muscular, COUNT(su.id)::int AS series
                 FROM series_usuario su JOIN exercicios e ON e.id = su.exercicio_id
                 WHERE su.usuario_id = $1 AND su.data_treino BETWEEN $2 AND $3
                 GROUP BY e.grupo_muscular ORDER BY series DESC`,
                [usuarioId, inicio, fim]
            ),
            pool.query(
                `SELECT COUNT(DISTINCT data_treino)::int AS dias_treinados,
                        COUNT(*)::int AS total_series
                 FROM series_usuario
                 WHERE usuario_id = $1 AND data_treino BETWEEN $2 AND $3`,
                [usuarioId, inicio, fim]
            ),
            pool.query(
                `SELECT e.nome_exercicio, e.grupo_muscular,
                        MAX(su.carga)::numeric AS carga_max,
                        ROUND(AVG(su.carga)::numeric, 1) AS carga_media
                 FROM series_usuario su JOIN exercicios e ON e.id = su.exercicio_id
                 WHERE su.usuario_id = $1 AND su.data_treino BETWEEN $2 AND $3 AND su.carga > 0
                 GROUP BY e.nome_exercicio, e.grupo_muscular
                 ORDER BY carga_max DESC LIMIT 10`,
                [usuarioId, inicio, fim]
            ),
            pool.query(
                `SELECT COUNT(*)::int AS sessoes_cardio,
                        COALESCE(SUM(duracao_min), 0)::int AS minutos_cardio,
                        COALESCE(ROUND(SUM(distancia_km)::numeric, 1), 0) AS km_cardio
                 FROM cardio_sessoes
                 WHERE usuario_id = $1 AND data BETWEEN $2 AND $3`,
                [usuarioId, inicio, fim]
            ),
        ]);

        return {
            dias_treinados: diasRes.rows[0]?.dias_treinados || 0,
            total_series:   diasRes.rows[0]?.total_series || 0,
            volume_por_grupo: volumeRes.rows,
            cargas_top: cargaRes.rows,
            cardio: cardioRes.rows[0],
        };
    };

    const [dados1, dados2] = await Promise.all([
        queryPeriodo(p1.inicio, p1.fim),
        queryPeriodo(p2.inicio, p2.fim),
    ]);

    return {
        status: 'comparacao_pronta',
        periodo1: { ...p1, ...dados1 },
        periodo2: { ...p2, ...dados2 },
    };
}

module.exports = { handleCompararPeriodos };
