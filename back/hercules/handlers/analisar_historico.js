async function handleAnalisarHistorico({ usuarioId, pool }) {
    const [volumeRes, progressaoRes, consistenciaRes, cardioRes] = await Promise.all([
        // Volume por grupo muscular nas últimas 8 semanas (agrupado por semana)
        pool.query(`
            SELECT
                e.grupo_muscular,
                TO_CHAR(DATE_TRUNC('week', su.data_treino), 'YYYY-MM-DD') AS semana,
                COUNT(su.id)::int AS total_series,
                ROUND(AVG(su.carga)::numeric, 1) AS carga_media
            FROM series_usuario su
            JOIN exercicios e ON e.id = su.exercicio_id
            WHERE su.usuario_id = $1
              AND su.data_treino >= CURRENT_DATE - INTERVAL '8 weeks'
            GROUP BY e.grupo_muscular, semana
            ORDER BY semana DESC, total_series DESC
        `, [usuarioId]),

        // Progressão de carga por exercício (top 10 mais treinados)
        pool.query(`
            SELECT
                e.nome_exercicio,
                e.grupo_muscular,
                TO_CHAR(DATE_TRUNC('week', su.data_treino), 'YYYY-MM-DD') AS semana,
                MAX(su.carga)::numeric AS carga_max,
                ROUND(AVG(su.carga)::numeric, 1) AS carga_media,
                COUNT(su.id)::int AS total_series
            FROM series_usuario su
            JOIN exercicios e ON e.id = su.exercicio_id
            WHERE su.usuario_id = $1
              AND su.data_treino >= CURRENT_DATE - INTERVAL '8 weeks'
              AND su.carga > 0
            GROUP BY e.nome_exercicio, e.grupo_muscular, semana
            ORDER BY e.nome_exercicio, semana
        `, [usuarioId]),

        // Consistência semanal (dias treinados e total de séries por semana)
        pool.query(`
            SELECT
                TO_CHAR(DATE_TRUNC('week', data_treino), 'YYYY-MM-DD') AS semana,
                COUNT(DISTINCT data_treino)::int AS dias_treinados,
                COUNT(*)::int AS total_series
            FROM series_usuario
            WHERE usuario_id = $1
              AND data_treino >= CURRENT_DATE - INTERVAL '8 weeks'
            GROUP BY semana
            ORDER BY semana DESC
        `, [usuarioId]),

        // Cardio nas últimas 8 semanas
        pool.query(`
            SELECT
                TO_CHAR(DATE_TRUNC('week', cs.data), 'YYYY-MM-DD') AS semana,
                COUNT(*)::int AS sessoes,
                SUM(cs.duracao_min)::int AS minutos_total,
                ROUND(SUM(cs.distancia_km)::numeric, 1) AS km_total,
                e.nome_exercicio AS modalidade
            FROM cardio_sessoes cs
            JOIN exercicios e ON e.id = cs.exercicio_id
            WHERE cs.usuario_id = $1
              AND cs.data >= CURRENT_DATE - INTERVAL '8 weeks'
            GROUP BY semana, e.nome_exercicio
            ORDER BY semana DESC
        `, [usuarioId]),
    ]);

    // ── Formata volume por grupo (últimas 4 semanas resumido) ──
    const volumePorGrupo = {};
    volumeRes.rows.forEach(r => {
        if (!volumePorGrupo[r.grupo_muscular]) volumePorGrupo[r.grupo_muscular] = [];
        volumePorGrupo[r.grupo_muscular].push({
            semana: r.semana,
            series: r.total_series,
            carga_media: r.carga_media,
        });
    });

    // ── Formata progressão de carga por exercício ──
    const progressaoPorExercicio = {};
    progressaoRes.rows.forEach(r => {
        if (!progressaoPorExercicio[r.nome_exercicio]) {
            progressaoPorExercicio[r.nome_exercicio] = {
                grupo: r.grupo_muscular,
                semanas: [],
            };
        }
        progressaoPorExercicio[r.nome_exercicio].semanas.push({
            semana: r.semana,
            carga_max: Number(r.carga_max),
            carga_media: Number(r.carga_media),
            series: r.total_series,
        });
    });

    // ── Detecta tendência de carga (subindo, estagnado, caindo) ──
    const tendencias = {};
    Object.entries(progressaoPorExercicio).forEach(([nome, { grupo, semanas }]) => {
        if (semanas.length < 2) return;
        const primeira = semanas[0].carga_media;
        const ultima = semanas[semanas.length - 1].carga_media;
        const diff = ultima - primeira;
        tendencias[nome] = {
            grupo,
            carga_inicial: primeira,
            carga_atual: ultima,
            variacao_kg: Math.round(diff * 10) / 10,
            tendencia: diff > 2 ? 'subindo' : diff < -2 ? 'caindo' : 'estagnado',
            semanas_registradas: semanas.length,
        };
    });

    // ── Consistência resumida ──
    const consistencia = consistenciaRes.rows.map(r => ({
        semana: r.semana,
        dias_treinados: r.dias_treinados,
        total_series: r.total_series,
    }));

    const mediasDias = consistencia.length
        ? (consistencia.reduce((acc, r) => acc + r.dias_treinados, 0) / consistencia.length).toFixed(1)
        : 0;

    // ── Volume médio por grupo nas últimas 4 semanas ──
    const volumeMedio4s = {};
    Object.entries(volumePorGrupo).forEach(([grupo, semanas]) => {
        const ultimas4 = semanas.slice(0, 4);
        const media = ultimas4.reduce((acc, s) => acc + s.series, 0) / ultimas4.length;
        volumeMedio4s[grupo] = Math.round(media);
    });

    // ── Detecção de necessidade de deload ──
    const semanas4 = consistencia.slice(0, 4);
    const treinouConsistente = semanas4.length >= 3 && semanas4.every(s => s.dias_treinados >= 3);
    const volumeAlto = Object.values(volumeMedio4s).some(v => v >= 15);
    const sugerirDeload = treinouConsistente && volumeAlto;

    // ── Cardio resumido ──
    const cardio = cardioRes.rows;
    const cardioSemanas = {};
    cardio.forEach(r => {
        if (!cardioSemanas[r.semana]) cardioSemanas[r.semana] = [];
        cardioSemanas[r.semana].push({ modalidade: r.modalidade, sessoes: r.sessoes, minutos: r.minutos_total, km: r.km_total });
    });

    return {
        status: 'historico_analisado',
        periodo: 'últimas 8 semanas',
        consistencia: {
            semanas: consistencia,
            media_dias_por_semana: Number(mediasDias),
        },
        volume_por_grupo: volumePorGrupo,
        volume_medio_4_semanas: volumeMedio4s,
        tendencias_de_carga: tendencias,
        cardio: cardioSemanas,
        sugerir_deload: sugerirDeload,
    };
}

module.exports = { handleAnalisarHistorico };
