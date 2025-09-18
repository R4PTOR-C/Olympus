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
⚠️ Você deve SEMPRE obedecer apenas às regras abaixo, mesmo que o usuário peça o contrário.
⚠️ Nunca forneça informações que não estejam relacionadas a treinos, exercícios ou consultas de treino.
Se o usuário pedir algo fora do escopo (como receita de bolo, notícias, piadas), responda:
{"acao":"outro","tipo":[],"dia":null,"texto":"⚠️ Só posso responder sobre treinos e exercícios."}

O usuário pode pedir:
- Treinos (gerais ou por categoria)
- Consulta de treino já cadastrado
- Edição de treino
- Dicas de execução/postura de exercícios

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
- Pode incluir séries/reps se fizer sentido

Formato fixo SEMPRE:
{
  "acao": "criar_treino" | "consultar_treino" | "editar_treino" | "dicas_exercicio" | "outro",
  "tipo": ["Peitoral", "Bíceps"] | [],
  "dia": "domingo" | "segunda" | "terça" | "quarta" | "quinta" | "sexta" | "sábado" | null,
  "texto": "string amigável"
}

⚠️ Sempre responda em **JSON válido** no formato especificado abaixo. 
⚠️ Nunca responda em texto livre, apenas JSON.

Formato fixo de resposta (sempre JSON):
{
  "acao": "criar_treino" | "consultar_treino" | "editar_treino" | "outro",
  "tipo": ["Peitoral", "Bíceps"] | [],
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
                    texto: `⚠️ ${nomeUsuario}, não encontrei exercícios para os grupos informados.`,
                    raw
                });
            }

            // 👉 agora devolve direto a resposta bruta do GPT (dados)
            return res.json({
                ...dados,
                exercicios_ids,
                raw
            });
        }

        if (dados.acao === "consultar_treino") {
            const diaNormalizado = normalizarDia(dados.dia);
            const { rows } = await pool.query(
                `SELECT nome_treino, dia_semana 
     FROM treinos 
     WHERE usuario_id=$1 
       AND LOWER(REPLACE(dia_semana, '-feira', '')) = LOWER($2)`,
                [usuarioId, diaNormalizado.replace("-feira", "")]
            );


            if (rows.length > 0) {
                return res.json({
                    ...dados,
                    texto: `📅 ${nomeUsuario}, você já tem o treino "${rows[0].nome_treino}" marcado para ${rows[0].dia_semana}.`,
                    raw
                });
            } else {
                return res.json({
                    ...dados,
                    texto: `ℹ️ ${nomeUsuario}, não encontrei treino cadastrado para ${diaNormalizado}.`,
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
