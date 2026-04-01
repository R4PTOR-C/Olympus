async function handleCriarPeriodizacao({ args, usuarioId, pool }) {
    const { semanas = 4, tipo = 'linear' } = args;

    // Busca treinos atuais com exercícios e séries/reps
    const { rows: treinos } = await pool.query(
        `SELECT t.id, t.nome_treino, t.dia_semana, t.grupo_muscular
         FROM treinos t WHERE t.usuario_id = $1 ORDER BY
             CASE LOWER(t.dia_semana)
                 WHEN 'segunda-feira' THEN 1 WHEN 'terça-feira' THEN 2
                 WHEN 'quarta-feira' THEN 3  WHEN 'quinta-feira' THEN 4
                 WHEN 'sexta-feira'  THEN 5  WHEN 'sábado' THEN 6
                 WHEN 'domingo'      THEN 7  ELSE 8
             END`,
        [usuarioId]
    );

    if (!treinos.length) {
        return { sucesso: false, erro: 'Nenhum treino cadastrado. Crie treinos primeiro.' };
    }

    // Busca exercícios de cada treino com cargas recentes
    const treinosComExercicios = await Promise.all(treinos.map(async treino => {
        const { rows: exercicios } = await pool.query(
            `SELECT e.nome_exercicio, e.grupo_muscular,
                    te.series_alvo, te.reps_alvo,
                    ROUND(AVG(su.carga)::numeric, 1) AS carga_atual,
                    MAX(su.carga)::numeric AS carga_max
             FROM treinos_exercicios te
             JOIN exercicios e ON e.id = te.exercicio_id
             LEFT JOIN series_usuario su ON su.exercicio_id = te.exercicio_id
                 AND su.usuario_id = $1
                 AND su.data_treino >= CURRENT_DATE - INTERVAL '4 weeks'
             WHERE te.treino_id = $2
             GROUP BY e.nome_exercicio, e.grupo_muscular, te.series_alvo, te.reps_alvo, te.ordem
             ORDER BY te.ordem`,
            [usuarioId, treino.id]
        );
        return { ...treino, exercicios };
    }));

    // Busca perfil
    const { rows: perfil } = await pool.query(
        `SELECT objetivo, genero FROM usuarios WHERE id = $1`, [usuarioId]
    );

    return {
        status: 'dados_periodizacao_prontos',
        tipo_periodizacao: tipo,
        semanas_solicitadas: semanas,
        perfil: perfil[0] || {},
        treinos_atuais: treinosComExercicios,
        instrucao: `Com base nos treinos acima e cargas recentes, crie um plano de ${semanas} semanas de periodização ${tipo}. Para cada semana, especifique as variações de volume (séries) e intensidade (carga % ou sugestão de kg) para cada exercício principal. Apresente em formato de tabela ou lista organizada por semana.`,
    };
}

module.exports = { handleCriarPeriodizacao };
