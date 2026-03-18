const diasSemana = [
    "domingo", "segunda-feira", "terça-feira", "quarta-feira",
    "quinta-feira", "sexta-feira", "sábado",
];

const diasSemanaFormatados = {
    "domingo":       "Domingo",
    "segunda-feira": "Segunda-feira",
    "terça-feira":   "Terça-feira",
    "quarta-feira":  "Quarta-feira",
    "quinta-feira":  "Quinta-feira",
    "sexta-feira":   "Sexta-feira",
    "sábado":        "Sábado",
};

function normalizarDia(dia) {
    if (!dia) return null;

    const s = dia.toString().trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const mapa = {
        dom: "domingo", domingo: "domingo",
        seg: "segunda-feira", segunda: "segunda-feira", "segunda-feira": "segunda-feira",
        ter: "terça-feira", terca: "terça-feira", "terca-feira": "terça-feira",
        qua: "quarta-feira", quarta: "quarta-feira", "quarta-feira": "quarta-feira",
        qui: "quinta-feira", quinta: "quinta-feira", "quinta-feira": "quinta-feira",
        sex: "sexta-feira", sexta: "sexta-feira", "sexta-feira": "sexta-feira",
        sab: "sábado", sabado: "sábado", "sabado": "sábado",
    };

    if (s === "hoje")  return diasSemana[new Date().getDay()];
    if (s === "amanha") return diasSemana[(new Date().getDay() + 1) % 7];

    return mapa[s] || dia;
}

function formatarDiaParaBanco(dia) {
    const norm = normalizarDia(dia);
    return norm ? (diasSemanaFormatados[norm] || norm) : null;
}

function ordenarDias(dias) {
    return [...dias].sort((a, b) => diasSemana.indexOf(a) - diasSemana.indexOf(b));
}

function formatarListaDias(dias) {
    return ordenarDias(dias).map(d => diasSemanaFormatados[d] || d);
}

async function buscarDiasLivres(usuarioId, pool) {
    const { rows } = await pool.query(
        "SELECT DISTINCT dia_semana FROM treinos WHERE usuario_id = $1",
        [usuarioId]
    );
    const ocupados = new Set(rows.map(r => normalizarDia(r.dia_semana)).filter(Boolean));
    return diasSemana.filter(d => !ocupados.has(d));
}

module.exports = {
    diasSemana,
    diasSemanaFormatados,
    normalizarDia,
    formatarDiaParaBanco,
    ordenarDias,
    formatarListaDias,
    buscarDiasLivres,
};
