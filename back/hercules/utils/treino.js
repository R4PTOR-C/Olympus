const { montarDescricaoTreino, grupoParaImagem } = require('./grupos');
const { formatarDiaParaBanco } = require('./dias');

async function salvarTreinoDoHercules({ usuarioId, tipos, exerciciosIds, dia, nome, seriesRepsPorId }, db) {
    const grupoPrincipal   = tipos[0] || "Geral";
    const gruposAuxiliares = tipos.slice(1);
    const nomeTreino       = nome || (tipos.length > 0 ? `Treino de ${tipos.join(" + ")}` : "Treino sugerido pelo Hércules");
    const descricao        = montarDescricaoTreino(tipos);
    const diaBanco         = formatarDiaParaBanco(dia);
    const imagem           = grupoParaImagem[grupoPrincipal] || "default.png";

    // Transação num único client (db.transaction): treino e exercícios entram juntos
    return db.transaction(async (tx) => {
        const { rows } = await tx.query(
            `INSERT INTO treinos (usuario_id, nome_treino, descricao, dia_semana, grupo_muscular, imagem, grupos_auxiliares)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [usuarioId, nomeTreino, descricao, diaBanco, grupoPrincipal, imagem, gruposAuxiliares]
        );
        const treino = rows[0];

        for (let i = 0; i < exerciciosIds.length; i++) {
            const id = exerciciosIds[i];
            const sr = seriesRepsPorId?.[id] || seriesRepsPorId?.[String(id)];
            await tx.query(
                "INSERT INTO treinos_exercicios (treino_id, exercicio_id, series_alvo, reps_alvo, ordem) VALUES ($1, $2, $3, $4, $5)",
                [treino.id, id, sr?.series || null, sr?.reps || null, i]
            );
        }
        return treino;
    });
}

module.exports = { salvarTreinoDoHercules };
