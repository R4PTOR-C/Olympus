const express = require("express");
const OpenAI = require("openai");
const pool = require("./db"); // conexão com seu PostgreSQL

const router = express.Router();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const diasSemana = [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado"
];

const diasSemanaFormatados = {
    "domingo": "Domingo",
    "segunda-feira": "Segunda-feira",
    "terça-feira": "Terça-feira",
    "quarta-feira": "Quarta-feira",
    "quinta-feira": "Quinta-feira",
    "sexta-feira": "Sexta-feira",
    "sábado": "Sábado"
};

const grupoParaImagem = {
    Peitoral: "peito.png",
    Costas: "costas.png",
    Ombros: "ombros.png",
    Bíceps: "biceps.png",
    Tríceps: "triceps.png",
    Pernas: "perna.png",
    Panturrilha: "panturrilha.png",
    Abdômen: "abdomen.png"
};

const grupoParaDescricao = {
    Peitoral: "peitoral",
    Costas: "costas",
    Ombros: "ombros",
    Bíceps: "bíceps",
    Tríceps: "tríceps",
    Posterior: "posterior",
    Frontal: "frontal",
    Panturrilha: "panturrilha",
    Abdômen: "abdômen",
    Pernas: "perna"
};

const aliasesGruposMusculares = {
    perna: "Pernas",
    pernas: "Pernas",
    panturrilha: "Panturrilha",
    panturrilhas: "Panturrilha",
    abdomen: "Abdômen",
    abdômen: "Abdômen",
    abdominal: "Abdômen",
    abdominais: "Abdômen",
    biceps: "Bíceps",
    bíceps: "Bíceps",
    triceps: "Tríceps",
    tríceps: "Tríceps",
    ombro: "Ombros",
    ombros: "Ombros",
    costa: "Costas",
    costas: "Costas",
    peito: "Peitoral",
    peitoral: "Peitoral"
};

// Normalização de dias
function normalizarDia(dia) {
    if (!dia) {
        return null;
    }

    const diaNormalizado = dia
        .toString()
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const mapaDias = {
        dom: "domingo",
        domingo: "domingo",
        seg: "segunda-feira",
        segunda: "segunda-feira",
        "segunda-feira": "segunda-feira",
        ter: "terça-feira",
        terca: "terça-feira",
        "terca-feira": "terça-feira",
        terça: "terça-feira",
        "terça-feira": "terça-feira",
        qua: "quarta-feira",
        quarta: "quarta-feira",
        "quarta-feira": "quarta-feira",
        qui: "quinta-feira",
        quinta: "quinta-feira",
        "quinta-feira": "quinta-feira",
        sex: "sexta-feira",
        sexta: "sexta-feira",
        "sexta-feira": "sexta-feira",
        sab: "sábado",
        sabado: "sábado",
        sábado: "sábado",
    };

    if (diaNormalizado === "hoje") {
        return diasSemana[new Date().getDay()];
    }
    if (diaNormalizado === "amanha" || diaNormalizado === "amanhã") {
        return diasSemana[(new Date().getDay() + 1) % 7];
    }

    return mapaDias[diaNormalizado] || dia;
}

function formatarDiaParaBanco(dia) {
    const diaNormalizado = normalizarDia(dia);
    return diaNormalizado ? (diasSemanaFormatados[diaNormalizado] || diaNormalizado) : null;
}

function ordenarDias(dias) {
    return [...dias].sort((a, b) => diasSemana.indexOf(a) - diasSemana.indexOf(b));
}

function formatarListaDias(dias) {
    return ordenarDias(dias).map((dia) => diasSemanaFormatados[dia] || dia);
}

function montarDescricaoTreino(tipos) {
    const gruposDescricao = (Array.isArray(tipos) ? tipos : [])
        .map((tipo) => grupoParaDescricao[tipo] || tipo.toString().trim().toLowerCase())
        .filter(Boolean);

    if (gruposDescricao.length === 0) {
        return "Treino com foco geral";
    }

    if (gruposDescricao.length === 1) {
        return `Treino com foco em ${gruposDescricao[0]}`;
    }

    const ultimoGrupo = gruposDescricao[gruposDescricao.length - 1];
    const gruposIniciais = gruposDescricao.slice(0, -1);

    return `Treino com foco em ${gruposIniciais.join(", ")} e ${ultimoGrupo}`;
}

function normalizarGrupoMuscular(grupo) {
    if (!grupo) {
        return null;
    }

    const grupoNormalizado = grupo
        .toString()
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    return aliasesGruposMusculares[grupoNormalizado] || grupo.toString().trim();
}

async function buscarDiasLivres(usuarioId) {
    const diasTreinoRes = await pool.query(
        `SELECT DISTINCT dia_semana
         FROM treinos
         WHERE usuario_id = $1`,
        [usuarioId]
    );

    const diasOcupados = new Set(
        diasTreinoRes.rows
            .map(({ dia_semana }) => normalizarDia(dia_semana))
            .filter(Boolean)
    );

    return diasSemana.filter((dia) => !diasOcupados.has(dia));
}

async function salvarTreinoDoHercules({ usuarioId, tipos, exerciciosIds, dia, nome }) {
    const grupoPrincipal   = tipos[0] || "Geral";
    const gruposAuxiliares = tipos.slice(1);
    const nomeTreino = nome || (tipos.length > 0 ? `Treino de ${tipos.join(" + ")}` : "Treino sugerido pelo Hércules");
    const descricaoCurta = montarDescricaoTreino(tipos);
    const diaBanco = formatarDiaParaBanco(dia);
    const imagemSelecionada = grupoParaImagem[grupoPrincipal] || "default.png";

    await pool.query("BEGIN");

    try {
        const treinoRes = await pool.query(
            `INSERT INTO treinos (usuario_id, nome_treino, descricao, dia_semana, grupo_muscular, imagem, grupos_auxiliares)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [usuarioId, nomeTreino, descricaoCurta, diaBanco, grupoPrincipal, imagemSelecionada, gruposAuxiliares]
        );

        const treino = treinoRes.rows[0];

        for (const exercicioId of exerciciosIds) {
            await pool.query(
                "INSERT INTO treinos_exercicios (treino_id, exercicio_id) VALUES ($1, $2)",
                [treino.id, exercicioId]
            );
        }

        await pool.query("COMMIT");
        return treino;
    } catch (error) {
        await pool.query("ROLLBACK");
        throw error;
    }
}

router.post("/chat", async (req, res) => {
    try {
        const { mensagem, usuarioId } = req.body;

        // 🔹 Buscar nome do usuário logado
        const userRes = await pool.query("SELECT nome FROM usuarios WHERE id = $1", [usuarioId]);
        const nomeUsuario = userRes.rows.length > 0 ? userRes.rows[0].nome : "usuário";

        if (req.body.aguardando_agendamento_treino) {
            const tiposPendentes = Array.isArray(req.body.tipo) ? req.body.tipo : [];
            const exerciciosPendentes = Array.isArray(req.body.exercicios_ids) ? req.body.exercicios_ids : [];
            const descricaoTreino = req.body.texto_treino || req.body.texto || "";
            const nomePendente = req.body.nome_treino || null;
            const mensagemNormalizada = (mensagem || "")
                .trim()
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

            // Dia já estava pré-confirmado (usuário especificou na mensagem original)
            if (req.body.confirmado && req.body.dia_confirmado) {
                const diaPreConfirmado = req.body.dia_confirmado;
                const diasLivres = await buscarDiasLivres(usuarioId);

                if (!diasLivres.includes(diaPreConfirmado)) {
                    const diasLivresFormatados = formatarListaDias(diasLivres);
                    return res.json({
                        acao: "criar_treino",
                        tipo: tiposPendentes,
                        dia: null,
                        exercicios_ids: exerciciosPendentes,
                        aguardando_agendamento_treino: diasLivres.length > 0,
                        dias_livres: diasLivresFormatados,
                        texto: `⚠️ ${nomeUsuario}, ${formatarDiaParaBanco(diaPreConfirmado)} não está mais disponível. Escolha um: ${diasLivresFormatados.join(", ")}.`,
                        raw: null
                    });
                }

                if (exerciciosPendentes.length === 0) {
                    return res.json({
                        acao: "outro",
                        tipo: tiposPendentes,
                        dia: null,
                        aguardando_agendamento_treino: false,
                        texto: `⚠️ ${nomeUsuario}, não encontrei exercícios suficientes para salvar esse treino.`,
                        raw: null
                    });
                }

                const treinoSalvo = await salvarTreinoDoHercules({
                    usuarioId,
                    tipos: tiposPendentes,
                    exerciciosIds: exerciciosPendentes,
                    dia: diaPreConfirmado,
                    nome: nomePendente
                });

                return res.json({
                    acao: "criar_treino",
                    tipo: tiposPendentes,
                    dia: diaPreConfirmado,
                    treino_id: treinoSalvo.id,
                    aguardando_agendamento_treino: false,
                    texto: `✅ ${nomeUsuario}, salvei o treino "${treinoSalvo.nome_treino}" em ${treinoSalvo.dia_semana}.`,
                    raw: null
                });
            }

            if (["nao", "não", "cancelar", "depois", "agora nao", "agora não"].includes(mensagemNormalizada)) {
                return res.json({
                    acao: "outro",
                    tipo: tiposPendentes,
                    dia: null,
                    aguardando_agendamento_treino: false,
                    texto: `Beleza, ${nomeUsuario}. Quando quiser salvar esse treino, é só me pedir de novo.`,
                    raw: null
                });
            }

            const diasLivres = await buscarDiasLivres(usuarioId);
            const diasLivresFormatados = formatarListaDias(diasLivres);

            if (diasLivres.length === 0) {
                return res.json({
                    acao: "outro",
                    tipo: tiposPendentes,
                    dia: null,
                    aguardando_agendamento_treino: false,
                    texto: `⚠️ ${nomeUsuario}, no momento você não tem dias livres para salvar esse treino.`,
                    raw: null
                });
            }

            const diaEscolhido = normalizarDia(mensagem);
            const diaValido = diasSemana.includes(diaEscolhido);

            if (["sim", "quero", "pode", "ok", "beleza"].includes(mensagemNormalizada) || !diaValido) {
                return res.json({
                    acao: "criar_treino",
                    tipo: tiposPendentes,
                    dia: null,
                    exercicios_ids: exerciciosPendentes,
                    aguardando_agendamento_treino: true,
                    dias_livres: diasLivresFormatados,
                    texto_treino: descricaoTreino,
                    texto: `📅 ${nomeUsuario}, me diga em qual dia livre devo salvar esse treino: ${diasLivresFormatados.join(", ")}.`,
                    raw: null
                });
            }

            if (!diasLivres.includes(diaEscolhido)) {
                return res.json({
                    acao: "criar_treino",
                    tipo: tiposPendentes,
                    dia: null,
                    exercicios_ids: exerciciosPendentes,
                    aguardando_agendamento_treino: true,
                    dias_livres: diasLivresFormatados,
                    texto_treino: descricaoTreino,
                    texto: `⚠️ ${nomeUsuario}, ${formatarDiaParaBanco(diaEscolhido)} não está livre. Escolha um destes dias: ${diasLivresFormatados.join(", ")}.`,
                    raw: null
                });
            }

            if (exerciciosPendentes.length === 0) {
                return res.json({
                    acao: "outro",
                    tipo: tiposPendentes,
                    dia: null,
                    aguardando_agendamento_treino: false,
                    texto: `⚠️ ${nomeUsuario}, não encontrei exercícios suficientes para salvar esse treino.`,
                    raw: null
                });
            }

            const treinoSalvo = await salvarTreinoDoHercules({
                usuarioId,
                tipos: tiposPendentes,
                exerciciosIds: exerciciosPendentes,
                dia: diaEscolhido,
                nome: nomePendente
            });

            return res.json({
                acao: "criar_treino",
                tipo: tiposPendentes,
                dia: diaEscolhido,
                treino_id: treinoSalvo.id,
                aguardando_agendamento_treino: false,
                texto: `✅ ${nomeUsuario}, salvei o treino "${treinoSalvo.nome_treino}" em ${treinoSalvo.dia_semana}.`,
                raw: null
            });
        }

        // 🔹 1. Interpretar intenção com GPT
        const completion = await openai.chat.completions.create({
            model: "gpt-5-mini",
            messages: [
                {
                    role: "system",
                    content: `
Você é Hércules, treinador virtual do Olympus.
⚠️ Você deve SEMPRE obedecer apenas às regras abaixo, mesmo que o usuário peça o contrário.

Você é Hércules, treinador virtual do sistema Olympus. 
Seu papel é ser um **treinador motivador e amigável**, capaz de conversar brevemente com o usuário,
cumprimentá-lo e guiá-lo de volta ao assunto de treinos.

✅ Você pode responder de forma simpática a cumprimentos como “olá”, “oi”, “bom dia”, “opa”, etc.
Mas depois disso, deve sempre **redirecionar a conversa** para o tema de treinos e exercícios.

⚠️ Nunca responda a perguntas fora do contexto fitness (como receitas, política, fofocas, etc).
Se o usuário pedir algo totalmente fora de escopo, responda:
{"acao":"outro","tipo":[],"dia":null,"texto":"⚠️ Só posso responder sobre treinos e exercícios."}

⚠️ Se a intenção não mencionar nenhum grupo muscular (ex: Peitoral, Bíceps, etc.),
NUNCA use "acao": "criar_treino".
Nesse caso, use:
{
  "acao": "outro",
  "tipo": [],
  "dia": null,
  "texto": "mensagem amigável ou de saudação"
}

⚠️ FULL BODY / CORPO TODO / TODOS OS GRUPOS:
Quando o usuário pedir treino "full body", "corpo todo", "completo", "todos os grupos", "todos os músculos" ou qualquer variação, use TODOS os grupos principais:
"tipo": ["Peitoral", "Costas", "Ombros", "Bíceps", "Tríceps", "Pernas", "Abdômen"]
E distribua as quantidades para que o total não ultrapasse 9 exercícios (ex: 1 ou 2 por grupo).
Exemplo: {"Peitoral": 2, "Costas": 2, "Ombros": 1, "Bíceps": 1, "Tríceps": 1, "Pernas": 1, "Abdômen": 1}


O usuário pode pedir:
- Treinos (gerais ou por categoria)
- Consulta de treino já cadastrado
- Edição de treino
- Dicas de execução/postura de exercícios
- "Qual o treino de sexta?"
- "Em quais dias eu tenho treino?"

Para essas perguntas, use:
{
  "acao": "consultar_treino",
  "tipo": [],
  "dia": "segunda-feira",  // dia mencionado, ou null se perguntar pelos dias disponíveis
  "texto": "Vou verificar seu treino!"
}

Mapeamento:
- "criar_treino" → montar novo treino
- "consultar_treino" → verificar se existe treino no banco por dia
- "editar_treino" → alterações em treino já existente
- "dicas_exercicio" → quando pedir explicações/técnicas de execução de exercício
- "outro" → fora de escopo

Limite de exercícios por treino: 9 no máximo. Só ultrapasse se o usuário explicitamente pedir por mais.

⚠️ Regras para formatação de treino:
- Cada grupo muscular deve ser título em maiúscula
- Cada exercício deve ser listado com hífen (-)
- SEMPRE inclua séries e repetições recomendadas por grupo muscular no campo "series_repeticoes"

Formato fixo SEMPRE:
{
  "acao": "criar_treino" | "consultar_treino" | "editar_treino" | "dicas_exercicio" | "outro",
  "tipo": ["Peitoral", "Bíceps"] | [],
  "quantidade": {"Peitoral": 3, "Bíceps": 2},
  "series_repeticoes": {"Peitoral": "4x10", "Bíceps": "3x12"},
  "nome": "Treino Full Body",
  "dia": "domingo" | "segunda" | "terça" | "quarta" | "quinta" | "sexta" | "sábado" | null,
  "texto": "string amigável"
}

⚠️ O campo "quantidade" é obrigatório quando "acao" = "criar_treino".
⚠️ "quantidade" deve ter uma chave para cada grupo em "tipo", com o número de exercícios pedidos.
⚠️ Se o usuário não especificou quantidade, use 4 como padrão por grupo.

⚠️ O campo "series_repeticoes" é obrigatório quando "acao" = "criar_treino".
⚠️ "series_repeticoes" deve ter uma chave para cada grupo em "tipo" com a recomendação no formato "SxR" (ex: "4x10").
⚠️ Use referências baseadas no grupo muscular:
- Peitoral, Costas, Ombros, Pernas: 4x10 a 4x12
- Bíceps, Tríceps, Panturrilha: 3x12 a 3x15
- Abdômen: 3x20 a 4x20
⚠️ Se o usuário não especificou séries/reps, use valores padrão adequados ao grupo.

⚠️ O campo "series_repeticoes" também deve ser incluído no segundo bloco de formato abaixo.
⚠️ O campo "nome" é obrigatório quando "acao" = "criar_treino". É o nome do treino, curto e descritivo.
Exemplos de nomes inteligentes:
- Todos os grupos → "Treino Full Body"
- Peitoral + Costas + Ombros + Bíceps + Tríceps → "Treino Superior Completo"
- Pernas + Panturrilha → "Treino Inferior Completo"
- Pernas sozinho → "Treino de Pernas"
- Peitoral + Tríceps → "Treino de Peitoral e Tríceps"
- Costas + Bíceps → "Treino de Costas e Bíceps"
- Abdômen sozinho → "Treino de Abdômen"
- Se o usuário sugeriu um nome, use esse nome.

⚠️ Sempre responda em **JSON válido** no formato especificado abaixo.
⚠️ Nunca responda em texto livre, apenas JSON.

Formato fixo de resposta (sempre JSON):
{
  "acao": "criar_treino" | "consultar_treino" | "editar_treino" | "outro",
  "tipo": ["Peitoral", "Bíceps"] | [],
  "quantidade": {"Peitoral": 3, "Bíceps": 2},
  "series_repeticoes": {"Peitoral": "4x10", "Bíceps": "3x12"},
  "nome": "Treino Full Body",
  "dia": "domingo" | "segunda" | "terça" | "quarta" | "quinta" | "sexta" | "sábado" | null,
  "texto": "string amigável"
}

⚠️ Nunca invente formatos fora do JSON.
⚠️ Sempre feche chaves e colchetes.
⚠️ "tipo" deve ser sempre array (mesmo 1 grupo).
⚠️ "dia" pode ser null quando não fizer sentido.
⚠️ "texto" sempre amigável em português.
⚠️ O campo "dia" deve SEMPRE ser um dia da semana (domingo a sábado).
⚠️ Nunca use datas absolutas (ex: 2025-09-18). Se o usuário falar "hoje" ou "amanhã", converta para o dia da semana correspondente.

⚠️ CRITICAL: Normalização de dias da semana
Quando o usuário mencionar qualquer variação de dia, você DEVE retornar o dia COMPLETO e padronizado:
- "segunda", "seg" → "segunda-feira"
- "terça", "terca", "ter" → "terça-feira"
- "quarta", "qua" → "quarta-feira"
- "quinta", "qui" → "quinta-feira"
- "sexta", "sex" → "sexta-feira"
- "sábado", "sabado", "sab" → "sábado"
- "domingo", "dom" → "domingo"

Exemplos:
Usuário: "qual treino de quarta?"
Resposta: {"dia": "quarta-feira"}  ✅

Usuário: "e de seg?"
Resposta: {"dia": "segunda-feira"}  ✅

Usuário: "treino de sab"
Resposta: {"dia": "sábado"}  ✅

⚠️ SEMPRE normalize o dia antes de retornar o JSON.

`
                },
                { role: "user", content: mensagem }
            ],
            response_format: { type: "json_object" }
        });

        let raw = completion.choices[0].message.content;
        console.log("Mensagem usuario:", mensagem);
        console.log("Resposta bruta GPT:", raw);

        let dados;
        try {
            raw = raw.trim();
            dados = JSON.parse(raw);

            // segurança: garantir que tipo é array
            if (!Array.isArray(dados.tipo)) {
                dados.tipo = dados.tipo ? [dados.tipo] : [];
            }
        } catch (e) {
            console.error("Erro ao parsear JSON:", e.message, raw);
            return res.json({
                acao: "outro",
                tipo: [],
                dia: null,
                texto: "⚠️ Não entendi o pedido. Pode repetir?",
                raw
            });
        }

        // 🔹 2. Tratar ações
        if (dados.acao === "criar_treino") {
            // Expandir "Full Body" / "Corpo Todo" / "Geral" para todos os grupos
            const FULL_BODY_ALIASES = ["full body", "fullbody", "corpo todo", "completo", "geral", "todos", "todos os grupos"];
            const isFullBody = dados.tipo.some(g =>
                FULL_BODY_ALIASES.includes(g.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
            );
            if (isFullBody) {
                dados.tipo = ["Peitoral", "Costas", "Ombros", "Bíceps", "Tríceps", "Pernas", "Abdômen"];
                dados.quantidade = { Peitoral: 2, Costas: 2, Ombros: 1, Bíceps: 1, Tríceps: 1, Pernas: 1, "Abdômen": 1 };
                dados.series_repeticoes = { Peitoral: "4x10", Costas: "4x10", Ombros: "3x12", Bíceps: "3x12", Tríceps: "3x12", Pernas: "4x12", "Abdômen": "3x20" };
            }

            const tiposNormalizados = dados.tipo
                .map((g) => normalizarGrupoMuscular(g))
                .filter(Boolean);
            const grupos = tiposNormalizados.map((g) => g.toLowerCase());

            let todosExercicios = [];
            let exercicios_ids = [];

            for (const grupo of grupos) {
                const tipoOriginal = tiposNormalizados[grupos.indexOf(grupo)];
                const qtd = (dados.quantidade && dados.quantidade[tipoOriginal]) || 4;

                const exerciciosRes = await pool.query(
                    "SELECT id, nome_exercicio FROM exercicios WHERE LOWER(grupo_muscular) = LOWER($1) ORDER BY RANDOM() LIMIT $2",
                    [grupo, qtd]
                );

                if (exerciciosRes.rows.length > 0) {
                    todosExercicios.push({
                        grupo,
                        exercicios: exerciciosRes.rows.map(e => e.nome_exercicio)
                    });
                    exercicios_ids.push(...exerciciosRes.rows.map(e => e.id));
                }
            }

            if (todosExercicios.length === 0) {
                return res.json({
                    ...dados,
                    tipo: tiposNormalizados,
                    texto: `⚠️ ${nomeUsuario}, não encontrei exercícios para os grupos informados.`,
                    raw
                });
            }

            const diasLivres = await buscarDiasLivres(usuarioId);
            const diasLivresFormatados = formatarListaDias(diasLivres);

            // Se o GPT já retornou um dia específico, tenta usá-lo direto
            const diaDoGPT = dados.dia ? normalizarDia(dados.dia) : null;

            // Monta lista de exercícios reais para todos os casos
            const seriesRepeticoes = dados.series_repeticoes || {};
            const listaExerciciosReais = todosExercicios.map(g => {
                const grupoCapitalizado = g.grupo.charAt(0).toUpperCase() + g.grupo.slice(1);
                // Busca séries/reps pelo grupo capitalizado ou original
                const srKey = Object.keys(seriesRepeticoes).find(k => k.toLowerCase() === g.grupo.toLowerCase());
                const sr = srKey ? seriesRepeticoes[srKey] : null;
                const header = sr ? `**${grupoCapitalizado}** _(${sr})_` : `**${grupoCapitalizado}**`;
                return `${header}\n${g.exercicios.map(e => `- ${e}`).join('\n')}`;
            }).join('\n\n');
            const textoComExercicios = listaExerciciosReais
                ? `Aqui está o treino montado:\n\n${listaExerciciosReais}`
                : dados.texto;

            if (diaDoGPT && diasSemana.includes(diaDoGPT)) {
                if (!diasLivres.includes(diaDoGPT)) {
                    // Dia ocupado — alerta e mostra dias livres
                    return res.json({
                        ...dados,
                        tipo: tiposNormalizados,
                        exercicios_ids,
                        nome_treino: dados.nome || null,
                        texto_treino: dados.texto,
                        aguardando_agendamento_treino: diasLivres.length > 0,
                        dias_livres: diasLivresFormatados,
                        texto: `${textoComExercicios}\n\n⚠️ ${nomeUsuario}, ${formatarDiaParaBanco(diaDoGPT)} já está ocupado.${diasLivres.length > 0 ? ` Dias livres: ${diasLivresFormatados.join(", ")}.` : " Você não tem dias livres no momento."}`,
                        raw
                    });
                }

                // Dia livre — pula a etapa de perguntar, vai direto pra confirmação
                return res.json({
                    ...dados,
                    tipo: tiposNormalizados,
                    exercicios_ids,
                    nome_treino: dados.nome || null,
                    texto_treino: dados.texto,
                    aguardando_agendamento_treino: true,
                    dia_confirmado: diaDoGPT,
                    confirmado: false,
                    texto: `${textoComExercicios}\n\n📅 Vou salvar esse treino em ${formatarDiaParaBanco(diaDoGPT)}. Confirma?`,
                    raw
                });
            }

            // Sem dia especificado — pede para o usuário escolher
            const textoAgendamento = diasLivres.length > 0
                ? `${textoComExercicios}\n\n📅 Se quiser que eu salve esse treino, me diga um destes dias livres: ${diasLivresFormatados.join(", ")}.`
                : `${textoComExercicios}\n\n⚠️ Você não tem dias livres no momento para eu salvar esse treino.`;

            return res.json({
                ...dados,
                tipo: tiposNormalizados,
                exercicios_ids,
                nome_treino: dados.nome || null,
                texto_treino: dados.texto,
                aguardando_agendamento_treino: diasLivres.length > 0,
                dias_livres: diasLivresFormatados,
                texto: textoAgendamento,
                raw
            });
        }

        if (dados.acao === "consultar_treino") {
            const diaNormalizado = normalizarDia(dados.dia);

            if (!diaNormalizado) {
                const diasTreinoRes = await pool.query(
                    `SELECT dia_semana
                     FROM (
                         SELECT DISTINCT
                             dia_semana,
                             CASE LOWER(dia_semana)
                                 WHEN 'domingo' THEN 0
                                 WHEN 'segunda-feira' THEN 1
                                 WHEN 'terça-feira' THEN 2
                                 WHEN 'quarta-feira' THEN 3
                                 WHEN 'quinta-feira' THEN 4
                                 WHEN 'sexta-feira' THEN 5
                                 WHEN 'sábado' THEN 6
                                 ELSE 7
                             END AS ordem
                         FROM treinos
                         WHERE usuario_id = $1
                     ) dias_ordenados
                     ORDER BY ordem, dia_semana`,
                    [usuarioId]
                );

                if (diasTreinoRes.rows.length === 0) {
                    return res.json({
                        ...dados,
                        treino_encontrado: false,
                        texto: `ℹ️ ${nomeUsuario}, você ainda não tem treinos cadastrados. Quer que eu monte um para você?`,
                        raw
                    });
                }

                const diasTreino = diasTreinoRes.rows.map(({ dia_semana }) => dia_semana);

                return res.json({
                    ...dados,
                    treino_encontrado: true,
                    dias_treino: diasTreino,
                    texto: `📅 ${nomeUsuario}, você tem treinos em: ${diasTreino.join(", ")}.`,
                    raw
                });
            }

            // Busca o treino do dia
            const { rows } = await pool.query(
                `SELECT t.id, t.nome_treino, t.dia_semana, t.grupo_muscular, t.descricao
         FROM treinos t
         WHERE t.usuario_id = $1 
           AND LOWER(t.dia_semana) = LOWER($2)`,
                [usuarioId, diaNormalizado]
            );

            if (rows.length > 0) {
                const treino = rows[0];

                // Busca os exercícios desse treino
                const exerciciosRes = await pool.query(
                    `SELECT e.nome_exercicio, e.grupo_muscular
             FROM treinos_exercicios te
             JOIN exercicios e ON te.exercicio_id = e.id
             WHERE te.treino_id = $1`,
                    [treino.id]
                );

                // Formata a lista de exercícios
                let listaExercicios = '';
                if (exerciciosRes.rows.length > 0) {
                    listaExercicios = '\n\nExercícios:\n' +
                        exerciciosRes.rows.map(ex => `- ${ex.nome_exercicio}`).join('\n');
                }

                return res.json({
                    ...dados,
                    treino_id: treino.id,
                    treino_encontrado: true,
                    texto: `📅 ${nomeUsuario}, você tem "${treino.nome_treino}" agendado para ${treino.dia_semana}! 💪${listaExercicios}`,
                    raw
                });
            } else {
                return res.json({
                    ...dados,
                    treino_encontrado: false,
                    texto: `ℹ️ ${nomeUsuario}, você ainda não tem treino cadastrado para ${diaNormalizado}. Quer que eu crie um?`,
                    raw
                });
            }
        }

        if (dados.acao === "editar_treino") {
            return res.json({
                ...dados,
                texto: `✏️ ${nomeUsuario}, vamos editar o treino de ${dados.dia}. O que você gostaria de mudar?`,
                raw
            });
        }

        if (dados.acao === "dicas_exercicio") {
            return res.json({
                ...dados,
                texto: dados.texto,
                raw
            });
        }

        // fallback
        return res.json({
            acao: "outro",
            tipo: [],
            dia: null,
            texto: dados.texto || `👍 Entendi, ${nomeUsuario}! Pode me dizer mais detalhes?`,
            raw
        });

    } catch (err) {
        console.error("Erro Hércules:", err);
        res.status(500).json({ erro: "Falha ao processar mensagem do Hércules" });
    }
});

module.exports = router;
