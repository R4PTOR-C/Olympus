const { normalizarGrupoMuscular } = require('../utils/grupos');
const { normalizarDia, buscarDiasLivres, diasSemana } = require('../utils/dias');
const pendingWorkouts = require('../utils/pendingWorkouts');

const FULL_BODY_GRUPOS = ["Peitoral", "Costas", "Ombros", "Bíceps", "Tríceps", "Pernas", "Abdômen"];
const POOL_POR_GRUPO   = 14;

async function handleCriarTreino({ args, usuarioId, pool }) {
    let grupos = (args.grupos_musculares || []).map(normalizarGrupoMuscular).filter(Boolean);
    if (grupos.length >= 7) grupos = FULL_BODY_GRUPOS;

    // ── 1. Perfil + recentes + pool em paralelo ──
    const [perfilRes, recentesRes, ...poolResults] = await Promise.all([
        pool.query("SELECT objetivo, genero FROM usuarios WHERE id = $1", [usuarioId]),
        pool.query(
            `SELECT DISTINCT e.nome_exercicio
             FROM series_usuario su
             JOIN exercicios e ON su.exercicio_id = e.id
             WHERE su.usuario_id = $1
               AND su.data_treino >= NOW() - INTERVAL '14 days'
             LIMIT 20`,
            [usuarioId]
        ),
        ...grupos.map(grupo => pool.query(
            `SELECT id, nome_exercicio,
                    COALESCE(nivel, 'Intermediário') AS nivel,
                    COALESCE(tipo,  'Composto')      AS tipo
             FROM exercicios
             WHERE LOWER(grupo_muscular) = LOWER($1)
               AND COALESCE(aprovado_geracao, TRUE) = TRUE
               AND COALESCE(ambiente, 'academia') = 'academia'
             ORDER BY CASE WHEN destaque = TRUE THEN 0 ELSE 1 END,
                      CASE tipo WHEN 'Composto' THEN 0 ELSE 1 END,
                      RANDOM()
             LIMIT $2`,
            [grupo, POOL_POR_GRUPO]
        )),
    ]);

    const perfil   = perfilRes.rows[0] || {};
    const recentes = recentesRes.rows.map(r => r.nome_exercicio);

    const exerciciosPorGrupo = {};
    grupos.forEach((grupo, i) => { exerciciosPorGrupo[grupo] = poolResults[i].rows; });

    // ── 2. Armazena pool server-side para mapeamento de nomes → IDs no salvar_treino ──
    pendingWorkouts.set(String(usuarioId), {
        pool: exerciciosPorGrupo,
        tipos: grupos,
        nome: args.nome,
    });

    // ── 3. Monta lista de exercícios disponíveis para o GPT ──
    const listaGrupos = grupos.map(grupo => {
        const exercicios = exerciciosPorGrupo[grupo];
        if (!exercicios?.length) return null;
        const linhas = exercicios.map(e => {
            const tag = recentes.includes(e.nome_exercicio) ? ' ⚠️ feito recentemente' : '';
            return `- ${e.nome_exercicio} [${e.tipo}, ${e.nivel}]${tag}`;
        }).join('\n');
        return `### ${grupo}\n${linhas}`;
    }).filter(Boolean).join('\n\n');

    const perfilTexto = [
        perfil.objetivo ? `Objetivo: ${perfil.objetivo}` : null,
        perfil.genero   ? `Gênero: ${perfil.genero}`     : null,
    ].filter(Boolean).join(' | ') || 'Perfil não informado';

    // ── 4. Retorna pool + contexto para o GPT principal montar o treino ──
    const diasLivres = await buscarDiasLivres(usuarioId, pool);
    const diaArg     = args.dia_semana ? normalizarDia(args.dia_semana) : null;

    return {
        status:       'pool_pronto',
        perfil:       perfilTexto,
        exercicios:   listaGrupos,
        dias_livres:  diasLivres,
        dia_sugerido: (diaArg && diasSemana.includes(diaArg) && diasLivres.includes(diaArg))  ? diaArg : null,
        dia_ocupado:  (diaArg && diasSemana.includes(diaArg) && !diasLivres.includes(diaArg)) ? diaArg : null,
    };
}

module.exports = { handleCriarTreino };
