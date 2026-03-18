const pendingWorkouts = require('../utils/pendingWorkouts');
const { salvarTreinoDoHercules } = require('../utils/treino');
const { buscarDiasLivres, normalizarDia } = require('../utils/dias');

function parseReps(r) {
    if (typeof r === 'number') return r;
    if (typeof r === 'string') {
        const m = r.match(/(\d+)-(\d+)/);
        return m ? parseInt(m[2]) : (parseInt(r) || null);
    }
    return null;
}

async function handleSalvarTreino({ args, usuarioId, pool }) {
    const pending = pendingWorkouts.get(String(usuarioId));
    if (!pending) {
        return { erro: 'Nenhum treino pendente. Peça para criar um treino primeiro.' };
    }

    const dia = normalizarDia(args.dia_semana) || args.dia_semana;
    const diasLivres = await buscarDiasLivres(usuarioId, pool);

    if (!diasLivres.includes(dia)) {
        return { erro: `${dia} não está disponível.`, dias_livres: diasLivres };
    }

    // Mapeia nomes recebidos do GPT para IDs do banco usando o pool armazenado
    const todosExercicios = Object.values(pending.pool).flat();
    const exercicios_ids     = [];
    const series_reps_por_id = {};

    for (const ex of (args.exercicios || [])) {
        const match = todosExercicios.find(
            e => e.nome_exercicio.toLowerCase() === ex.nome.toLowerCase()
        );
        if (match) {
            exercicios_ids.push(match.id);
            series_reps_por_id[match.id] = {
                series: ex.series || null,
                reps:   parseReps(ex.reps),
            };
        }
    }

    // Fallback: 4 primeiros de cada grupo se o mapeamento falhou
    if (exercicios_ids.length === 0) {
        for (const exs of Object.values(pending.pool)) {
            exs.slice(0, 4).forEach(e => exercicios_ids.push(e.id));
        }
    }

    if (exercicios_ids.length === 0) {
        return { erro: 'Não encontrei exercícios para salvar. Tente criar o treino novamente.' };
    }

    const treino = await salvarTreinoDoHercules(
        {
            usuarioId,
            tipos:           pending.tipos,
            exerciciosIds:   exercicios_ids,
            dia,
            nome:            args.nome || pending.nome,
            seriesRepsPorId: series_reps_por_id,
        },
        pool
    );

    pendingWorkouts.delete(String(usuarioId));

    return {
        sucesso:   true,
        treino_id: treino.id,
        nome:      treino.nome_treino,
        dia:       treino.dia_semana,
    };
}

module.exports = { handleSalvarTreino };
