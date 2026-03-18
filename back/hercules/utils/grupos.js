const grupoParaImagem = {
    Peitoral:    "peito.png",
    Costas:      "costas.png",
    Ombros:      "ombros.png",
    "Bíceps":    "biceps.png",
    "Tríceps":   "triceps.png",
    Pernas:      "perna.png",
    Panturrilha: "panturrilha.png",
    "Abdômen":   "abdomen.png",
};

const grupoParaDescricao = {
    Peitoral:    "peitoral",
    Costas:      "costas",
    Ombros:      "ombros",
    "Bíceps":    "bíceps",
    "Tríceps":   "tríceps",
    Panturrilha: "panturrilha",
    "Abdômen":   "abdômen",
    Pernas:      "perna",
};

const aliasesGruposMusculares = {
    perna: "Pernas", pernas: "Pernas",
    panturrilha: "Panturrilha", panturrilhas: "Panturrilha",
    abdomen: "Abdômen", abdome: "Abdômen", abdominal: "Abdômen", abdominais: "Abdômen",
    biceps: "Bíceps", bicep: "Bíceps",
    triceps: "Tríceps", tricep: "Tríceps",
    ombro: "Ombros", ombros: "Ombros",
    costa: "Costas", costas: "Costas",
    peito: "Peitoral", peitoral: "Peitoral",
};

function normalizarGrupoMuscular(grupo) {
    if (!grupo) return null;
    const s = grupo.toString().trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return aliasesGruposMusculares[s] || grupo.toString().trim();
}

function montarDescricaoTreino(tipos) {
    const grupos = (Array.isArray(tipos) ? tipos : [])
        .map(t => grupoParaDescricao[t] || t.toString().trim().toLowerCase())
        .filter(Boolean);

    if (grupos.length === 0) return "Treino com foco geral";
    if (grupos.length === 1) return `Treino com foco em ${grupos[0]}`;

    const ultimo = grupos[grupos.length - 1];
    return `Treino com foco em ${grupos.slice(0, -1).join(", ")} e ${ultimo}`;
}

module.exports = {
    grupoParaImagem,
    grupoParaDescricao,
    normalizarGrupoMuscular,
    montarDescricaoTreino,
};
