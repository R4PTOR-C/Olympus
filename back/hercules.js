const express = require("express");
const OpenAI = require("openai");
const pool = require("./db"); // conexão com seu PostgreSQL

const router = express.Router();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Normalização de dias
function normalizarDia(dia) {
    const diasSemana = [
        "domingo", "segunda-feira", "terça-feira",
        "quarta-feira", "quinta-feira", "sexta-feira", "sábado"
    ];

    if (dia === "hoje") {
        return diasSemana[new Date().getDay()];
    }
    if (dia === "amanhã") {
        return diasSemana[(new Date().getDay() + 1) % 7];
    }
    return dia;
}

router.post("/chat", async (req, res) => {
    try {
        const { mensagem, usuarioId } = req.body;

        // 🔹 Buscar nome do usuário logado
        const userRes = await pool.query("SELECT nome FROM usuarios WHERE id = $1", [usuarioId]);
        const nomeUsuario = userRes.rows.length > 0 ? userRes.rows[0].nome : "usuário";

        // 🔹 1. Interpretar intenção com GPT
        const completion = await openai.chat.completions.create({
            model: "gpt-5-mini",
            messages: [
                {
                    role: "system",
                    content: `
Você é Hércules, treinador virtual do Olympus.
O usuário se chama ${nomeUsuario}.
Responda **sempre** com um único JSON válido.

Formato obrigatório:
{
  "acao": "criar_treino" | "consultar_treino" | "editar_treino" | "outro",
  "tipo": ["Peitoral", "Bíceps"] | [],
  "dia": "string" | null,
  "texto": "string amigável"
}

📌 Regras principais:
- Nunca invente formatos fora do JSON.
- Sempre feche chaves e colchetes.
- "tipo" deve ser sempre array (mesmo 1 grupo).
- "dia" pode ser null quando não fizer sentido.
- "texto" sempre amigável em português.
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
                texto: "⚠️ Não entendi o pedido. Pode repetir?"
            });
        }

        // 🔹 2. Tratar ações
        if (dados.acao === "criar_treino") {
            const grupos = dados.tipo.map(g => g.toLowerCase());

            let todosExercicios = [];
            let exercicios_ids = [];

            for (const grupo of grupos) {
                const exerciciosRes = await pool.query(
                    "SELECT id, nome_exercicio FROM exercicios WHERE LOWER(grupo_muscular) = LOWER($1) LIMIT 5",
                    [grupo]
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
                    texto: `⚠️ ${nomeUsuario}, não encontrei exercícios para os grupos informados.`
                });
            }

            // Montar lista formatada
            const listaFormatada = todosExercicios.map(
                g => `${g.grupo.toUpperCase()}: ${g.exercicios.join(", ")}`
            ).join("\n");

            // 🔹 2º GPT só para formatar treino
            const completion2 = await openai.chat.completions.create({
                model: "gpt-5-mini",
                messages: [
                    {
                        role: "system",
                        content: `
Você é Hércules, treinador virtual do Olympus.
Responda SEMPRE com JSON válido no formato:
{
  "acao": "criar_treino",
  "tipo": ["Peitoral", "Ombros"],
  "dia": null,
  "texto": "string amigável"
}
`
                    },
                    {
                        role: "user",
                        content: `Monte um treino para ${nomeUsuario}, focado em ${dados.tipo.join(", ")}.
Exercícios disponíveis:
${listaFormatada}

Monte o "texto" em formato de lista numerada, bem organizado, incluindo séries/reps se fizer sentido.
Não inclua descrições longas.
`
                    }
                ],
                response_format: { type: "json_object" }
            });

            let respostaFinal = completion2.choices[0].message.content;
            let dadosFinal = JSON.parse(respostaFinal);

            return res.json({
                ...dadosFinal,
                exercicios_ids
            });
        }

        if (dados.acao === "consultar_treino") {
            const diaNormalizado = normalizarDia(dados.dia);
            const { rows } = await pool.query(
                "SELECT nome_treino, dia_semana FROM treinos WHERE usuario_id=$1 AND LOWER(dia_semana)=LOWER($2)",
                [usuarioId, diaNormalizado]
            );

            if (rows.length > 0) {
                return res.json({
                    ...dados,
                    texto: `📅 ${nomeUsuario}, você já tem o treino "${rows[0].nome_treino}" marcado para ${rows[0].dia_semana}.`
                });
            } else {
                return res.json({
                    ...dados,
                    texto: `ℹ️ ${nomeUsuario}, não encontrei treino cadastrado para ${diaNormalizado}.`
                });
            }
        }

        if (dados.acao === "editar_treino") {
            return res.json({
                ...dados,
                texto: `✏️ ${nomeUsuario}, vamos editar o treino de ${dados.dia}. O que você gostaria de mudar?`
            });
        }

        // fallback
        return res.json({
            acao: "outro",
            tipo: [],
            dia: null,
            texto: dados.texto || `👍 Entendi, ${nomeUsuario}! Pode me dizer mais detalhes?`
        });

    } catch (err) {
        console.error("Erro Hércules:", err);
        res.status(500).json({ erro: "Falha ao processar mensagem do Hércules" });
    }
});

module.exports = router;
