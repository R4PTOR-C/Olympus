const express = require("express");
const OpenAI  = require("openai");
const pool    = require("../db");

const { TOOLS }                  = require("./tools");
const { handleCriarTreino }      = require("./handlers/criar_treino");
const { handleSalvarTreino }     = require("./handlers/salvar_treino");
const { handleConsultarTreino }  = require("./handlers/consultar_treino");
const { handleDicasExercicio }   = require("./handlers/dicas_exercicio");
const { handleResponder }        = require("./handlers/responder");

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL  = process.env.OPENAI_MODEL || "gpt-5.4";
const MAX_ITER = 6;

const SYSTEM_PROMPT = `Você é Hércules, treinador virtual do Olympus. Responda sempre em português.
Você é especialista em treinos de academia, hipertrofia e condicionamento físico.
Seja motivador, direto e amigável — como um personal trainer de verdade.
Para pedidos fora do contexto fitness, use a ferramenta "responder" com fora_de_escopo: true.
Para full body / corpo todo, inclua todos os 7 grupos: Peitoral, Costas, Ombros, Bíceps, Tríceps, Pernas, Abdômen.

## Fluxo de criação de treino

Ao receber o resultado de criar_treino (campo "exercicios" com o pool disponível):

1. Selecione os exercícios para o treino seguindo estas regras:
   - Use APENAS os grupos musculares solicitados pelo usuário — nunca adicione grupos extras (ex: se pediu só Costas, não inclua Bíceps nem Abdômen)
   - Comece pelo exercício mais difícil/exigente (ex: barra fixa, agachamento livre, supino livre) e finalize com isolamentos
   - Prefira barras e halteres sobre máquinas — use máquinas e cabos como complemento ou finalizadores, não como base do treino
   - Para Costas: equilibre puxadas verticais (barra fixa, puxada frontal) com remadas horizontais (remada curvada, unilateral, cavalinho) e finalize com isolamento de grande dorsal (pull-over)
   - Varie equipamentos — não repita o mesmo tipo em sequência
   - Nunca inclua dois exercícios com o mesmo vetor de força e área muscular (redundância biomecânica)
   - Priorize exercícios mainstream e amplamente conhecidos em academias brasileiras. Evite variações técnicas/nichadas (ex: supino JM, pegada invertida, pressão unilateral) a menos que o usuário peça explicitamente
   - Grupos grandes (Peitoral, Costas, Pernas): mais volume. Auxiliares (Bíceps, Tríceps, Ombros): menos
   - Varie as repetições por intensidade: compostos pesados (ex: barra fixa, remada com barra) 6–8 reps; compostos secundários 10–12 reps; isolamentos 12–15 reps
   - Se você chamou criar_treino com "exercicios_obrigatorios": inclua esses exercícios no treino obrigatoriamente, na posição correta da sequência (desde que existam na lista disponível)
   - Total: 6 a 10 exercícios. Use os nomes EXATOS da lista

## Exercícios âncora por grupo (priorize estes quando disponíveis no pool)
- **Peitoral:** Supino Reto com Barra → Supino Inclinado com Halter → Crucifixo com Halter → Cross-over na Polia
- **Costas:** Barra Fixa → Remada Curvada com Barra → Remada Unilateral com Halter → Puxada Frontal na Polia → Pull-over
- **Ombros:** Desenvolvimento com Barra ou Halter → Elevação Lateral com Halter → Elevação Frontal → Crucifixo Invertido
- **Bíceps:** Rosca Direta com Barra → Rosca Alternada com Halter → Rosca Martelo → Rosca Concentração
- **Tríceps:** Tríceps Testa com Barra EZ (Skull Crusher) → Tríceps Corda na Polia → Tríceps Francês com Halter → Supino Fechado
- **Pernas:** Agachamento Livre → Leg Press → Cadeira Extensora → Mesa Flexora → Stiff com Barra
- **Abdômen:** Prancha → Abdominal Crunch → Elevação de Pernas

2. Escreva sua resposta em markdown com: título, exercícios por grupo (séries×reps + dica específica), descanso, aquecimento e variações

3. Chame salvar_treino com os exercícios selecionados (nome exato, series, reps):
   - Se "dia_sugerido" estiver preenchido: use esse dia
   - Se não: pergunte ao usuário qual dos "dias_livres" prefere, depois chame salvar_treino

A resposta ao usuário e a chamada de salvar_treino devem acontecer juntas quando o dia já estiver definido.

## Confirmação de salvamento
Quando o usuário estiver apenas escolhendo o dia para salvar um treino já apresentado:
- Chame salvar_treino com os exercícios do treino já mostrado na conversa
- Responda de forma CURTA: apenas confirme o nome do treino e o dia. Não reescreva o treino, não repita exercícios, não adicione dicas. Uma linha é suficiente.`;


const HANDLERS = {
    criar_treino:     handleCriarTreino,
    salvar_treino:    handleSalvarTreino,
    consultar_treino: handleConsultarTreino,
    dicas_exercicio:  handleDicasExercicio,
    responder:        handleResponder,
};

// ── POST /hercules/chat ──────────────────────────────────────────────────────
router.post("/chat", async (req, res) => {
    try {
        const { mensagem, usuarioId, conversaId } = req.body;

        const [userRes, historicoRows] = await Promise.all([
            pool.query("SELECT nome FROM usuarios WHERE id = $1", [usuarioId]),
            conversaId
                ? pool.query(
                    `SELECT autor, texto FROM hercules_mensagens
                     WHERE conversa_id = $1 ORDER BY criado_em DESC LIMIT 10`,
                    [conversaId]
                  )
                : Promise.resolve({ rows: [] }),
        ]);

        const nomeUsuario = userRes.rows[0]?.nome || "usuário";
        const historico   = historicoRows.rows.reverse().map(r => ({
            role:    r.autor === 'user' ? 'user' : 'assistant',
            content: r.texto,
        }));

        // ── Loop agentico ──────────────────────────────────────────────────
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...historico,
            { role: "user", content: mensagem },
        ];

        let ultimaAcao   = "outro";
        let ultimaTreinoId = null;

        for (let i = 0; i < MAX_ITER; i++) {
            const response = await openai.chat.completions.create({
                model: MODEL,
                messages,
                tools:       TOOLS,
                tool_choice: "auto",
            });

            const message = response.choices[0].message;
            messages.push(message);

            // GPT terminou — retorna resposta final ao usuário
            if (!message.tool_calls?.length) {
                return res.json({
                    acao:      ultimaAcao,
                    treino_id: ultimaTreinoId,
                    texto:     message.content || `👍 Pode me dizer mais detalhes, ${nomeUsuario}?`,
                });
            }

            // GPT enviou texto + tool_call juntos: executa a tool e retorna o texto como resposta final
            const textoJunto = message.content || null;

            // Executa a tool call
            const toolCall     = message.tool_calls[0];
            const functionName = toolCall.function.name;
            const args         = JSON.parse(toolCall.function.arguments);
            const handler      = HANDLERS[functionName];

            let toolResult;
            if (handler) {
                toolResult = await handler({ args, usuarioId, nomeUsuario, pool, openai, model: MODEL });
            } else {
                toolResult = { erro: `Ferramenta '${functionName}' não encontrada` };
            }

            if (functionName === 'criar_treino') ultimaAcao = 'criar_treino';
            if (functionName === 'salvar_treino' && toolResult.sucesso) {
                ultimaAcao     = 'treino_salvo';
                ultimaTreinoId = toolResult.treino_id;

                // Se GPT enviou o treino em texto junto com a chamada de salvar, retorna já
                if (textoJunto) {
                    return res.json({
                        acao:      'treino_salvo',
                        treino_id: ultimaTreinoId,
                        texto:     textoJunto,
                    });
                }
            }

            // Adiciona resultado ao contexto para próxima iteração
            messages.push({
                role:         "tool",
                tool_call_id: toolCall.id,
                content:      JSON.stringify(toolResult),
            });
        }

        // Limite de iterações atingido
        return res.json({ acao: "outro", texto: `⚠️ ${nomeUsuario}, não consegui completar a solicitação. Tente novamente.` });

    } catch (err) {
        console.error("Erro Hércules:", err);
        res.status(500).json({ erro: "Falha ao processar mensagem do Hércules" });
    }
});

// ── Histórico / Conversas ────────────────────────────────────────────────────
router.post("/historico", async (req, res) => {
    try {
        const { usuarioId, autor, texto, meta, conversaId } = req.body;
        await pool.query(
            "INSERT INTO hercules_mensagens (usuario_id, autor, texto, meta, conversa_id) VALUES ($1, $2, $3, $4, $5)",
            [usuarioId, autor, texto, meta || null, conversaId || null]
        );
        res.json({ ok: true });
    } catch (err) {
        console.error("Erro ao salvar histórico:", err);
        res.status(500).json({ erro: "Falha ao salvar mensagem" });
    }
});

router.get("/historico/:conversaId", async (req, res) => {
    try {
        const { rows } = await pool.query(
            "SELECT autor, texto, meta FROM hercules_mensagens WHERE conversa_id = $1 ORDER BY criado_em ASC",
            [req.params.conversaId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ erro: "Falha ao buscar histórico" });
    }
});

router.get("/conversas/:usuarioId", async (req, res) => {
    try {
        const { rows } = await pool.query(
            "SELECT id, titulo, criado_em FROM hercules_conversas WHERE usuario_id = $1 ORDER BY criado_em DESC",
            [req.params.usuarioId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ erro: "Falha ao listar conversas" });
    }
});

router.post("/conversas", async (req, res) => {
    try {
        const { usuarioId, titulo } = req.body;
        const { rows } = await pool.query(
            "INSERT INTO hercules_conversas (usuario_id, titulo) VALUES ($1, $2) RETURNING *",
            [usuarioId, (titulo || "Nova conversa").substring(0, 80)]
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ erro: "Falha ao criar conversa" });
    }
});

router.delete("/conversas/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM hercules_conversas WHERE id = $1", [req.params.id]);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ erro: "Falha ao deletar conversa" });
    }
});

module.exports = router;
