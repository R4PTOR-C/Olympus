const express = require("express");
const OpenAI = require("openai");
const pool = require("./db"); // conexão com seu PostgreSQL

const router = express.Router();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

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
        const { mensagem, usuarioId, confirmado } = req.body;

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
Responda **sempre** com um único JSON válido, sem explicações, sem markdown, sem texto fora do JSON.

Formato obrigatório:
{
  "acao": "criar_treino" | "consultar_treino" | "editar_treino" | "outro",
  "tipo": "string ou null",
  "dia": "string ou null",
  "texto": "string amigável"
}

📌 Regras principais:
1. Consultas de treino  
   - Perguntas como "tenho treino hoje?", "e amanhã?", "possuo treinos na quarta?" → "acao": "consultar_treino".  
   - No Olympus, treinos são fixos por dia da semana. Nunca pergunte se é desta semana ou da próxima.  
   - Normalize sempre o dia em minúsculo e com hífen, por exemplo: "segunda-feira", "terça-feira", "quarta-feira", "sábado".  

2. Criação de treino  
   - Pedidos como "monta um treino", "criar treino de perna amanhã", "preciso de treino de peito na segunda" → "acao": "criar_treino".  
   - Se mencionar grupo muscular ou objetivo (peito, costas, perna, bíceps, hipertrofia, emagrecimento), retorne em "tipo".  
   - Normalize o campo "dia" como no item 1.  

3. Edição de treino  
   - Pedidos como "editar treino de terça", "mudar meu treino de peito", "alterar treino da sexta" → "acao": "editar_treino".  

4. Cumprimentos / conversas gerais  
   - Saudações como "oi", "olá", "bom dia", "fala Hércules" → "acao": "outro", mas "texto" deve ser uma saudação amigável incluindo o nome do usuário.  
   - Exemplos de resposta em "texto":  
     - "Olá ${nomeUsuario}! Eu sou Hércules, seu treinador no Olympus. Como posso ajudar hoje? Criar, consultar ou editar um treino?"  

5. Erros / ambiguidades  
   - Se não entender o pedido, devolva exatamente:  
     {"acao":"outro","tipo":null,"dia":null,"texto":"⚠️ Não entendi o pedido. Pode repetir?"}  

📌 Observações:
- Nunca use datas específicas (como 27/08/2025). Apenas dias da semana.  
- Nunca retorne JSON vazio. Sempre preencha todos os campos.  
- "tipo" e "dia" podem ser null quando não fizer sentido.  
- "texto" deve ser sempre uma frase amigável, em português, natural e útil para o usuário.  
`
                }




                ,
                { role: "user", content: mensagem }
            ],
            response_format: { type: "json_object" }, // 👈 aqui força JSON
            max_completion_tokens: 1000
        });


        // 🔹 2. Parsear resposta (já vem em JSON puro)
        // 🔹 2. Parsear resposta (já vem em JSON puro)
        let dados;
        let raw = completion.choices[0].message.content;
        console.log("Resposta bruta do GPT:", raw);

        try {
            raw = raw.trim(); // remove espaços e quebras
            dados = JSON.parse(raw);
            console.log("JSON parseado:", dados);
        } catch (e) {
            console.error("Erro ao parsear JSON:", e.message, raw);
            return res.json({
                acao: "outro",
                dia: null,
                texto: "⚠️ Não entendi o pedido. Pode repetir?"
            });
        }




        // 🔹 3. Tratar ações
        if (dados.acao === "criar_treino") {
            if (!confirmado) {
                return res.json({
                    ...dados,
                    texto: `💪 ${nomeUsuario}, preparei um treino de ${dados.tipo} para ${dados.dia}. Aqui está a sugestão:\n\n${plano}\n\nDeseja confirmar a criação?`,
                    plano,
                    confirmado: false,
                    exercicios_ids: exerciciosRes.rows.map(e => e.id)
                });
            } else {
                const { plano, exercicios_ids } = req.body;

                // Criar treino no banco
                const result = await pool.query(
                    `INSERT INTO treinos (usuario_id, nome_treino, descricao, dia_semana, grupo_muscular, imagem)
                     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                    [
                        usuarioId,
                        `${dados.tipo} - ${dados.dia}`,
                        plano, // 👈 agora usa o plano já aprovado pelo usuário
                        dados.dia,
                        dados.tipo,
                        "default.png"
                    ]
                );

                const treinoId = result.rows[0].id;

                // Vincular exercícios sugeridos
                for (const exId of exercicios_ids) {
                    await pool.query(
                        "INSERT INTO treinos_exercicios (treino_id, exercicio_id) VALUES ($1, $2)",
                        [treinoId, exId]
                    );
                }

                return res.json({
                    ...dados,
                    texto: `✅ ${nomeUsuario}, treino de ${dados.tipo} criado para ${dados.dia} com os exercícios vinculados.`,
                    confirmado: true
                });
            }
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

        // 🔹 fallback
        return res.json({
            acao: "outro",
            dia: null,
            texto: dados.texto || `👍 Entendi, ${nomeUsuario}! Pode me dizer mais detalhes?`
        });

    } catch (err) {
        console.error("Erro Hércules:", err);
        res.status(500).json({ erro: "Falha ao processar mensagem do Hércules" });
    }
});

module.exports = router;
