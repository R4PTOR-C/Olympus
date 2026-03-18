const { normalizarDia } = require('../utils/dias');

async function handleConsultarTreino({ args, usuarioId, nomeUsuario, pool }) {
    const diaNormalizado = args.dia_semana ? normalizarDia(args.dia_semana) : null;

    // Sem dia → lista todos os dias com treino
    if (!diaNormalizado) {
        const { rows } = await pool.query(
            `SELECT dia_semana FROM (
                SELECT DISTINCT dia_semana,
                    CASE LOWER(dia_semana)
                        WHEN 'domingo'       THEN 0
                        WHEN 'segunda-feira' THEN 1
                        WHEN 'terça-feira'   THEN 2
                        WHEN 'quarta-feira'  THEN 3
                        WHEN 'quinta-feira'  THEN 4
                        WHEN 'sexta-feira'   THEN 5
                        WHEN 'sábado'        THEN 6
                        ELSE 7
                    END AS ordem
                FROM treinos WHERE usuario_id = $1
            ) d ORDER BY ordem`,
            [usuarioId]
        );

        if (rows.length === 0) {
            return {
                acao: "consultar_treino",
                treino_encontrado: false,
                texto: `ℹ️ ${nomeUsuario}, você ainda não tem treinos cadastrados. Quer que eu monte um para você?`,
            };
        }

        const dias = rows.map(r => r.dia_semana);
        return {
            acao: "consultar_treino",
            treino_encontrado: true,
            dias_treino: dias,
            texto: `📅 ${nomeUsuario}, você tem treinos em: ${dias.join(", ")}.`,
        };
    }

    // Com dia → busca treino específico
    const { rows } = await pool.query(
        `SELECT t.id, t.nome_treino, t.dia_semana
         FROM treinos t
         WHERE t.usuario_id = $1 AND LOWER(t.dia_semana) = LOWER($2)`,
        [usuarioId, diaNormalizado]
    );

    if (rows.length === 0) {
        return {
            acao: "consultar_treino",
            treino_encontrado: false,
            texto: `ℹ️ ${nomeUsuario}, você não tem treino em ${diaNormalizado}. Quer que eu crie um?`,
        };
    }

    const treino = rows[0];
    const { rows: exercicios } = await pool.query(
        `SELECT e.nome_exercicio
         FROM treinos_exercicios te
         JOIN exercicios e ON te.exercicio_id = e.id
         WHERE te.treino_id = $1 ORDER BY te.ordem`,
        [treino.id]
    );

    const listaExercicios = exercicios.length > 0
        ? '\n\nExercícios:\n' + exercicios.map(e => `- ${e.nome_exercicio}`).join('\n')
        : '';

    return {
        acao: "consultar_treino",
        treino_id: treino.id,
        treino_encontrado: true,
        texto: `📅 ${nomeUsuario}, você tem "${treino.nome_treino}" em ${treino.dia_semana}! 💪${listaExercicios}`,
    };
}

module.exports = { handleConsultarTreino };
