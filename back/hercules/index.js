const express = require("express");
const OpenAI  = require("openai");
const pool    = require("../db");
const { authenticate, requireSelf } = require("../middleware/auth");
const { SQL_HOJE } = require("../config/datas");
const pendingWorkouts = require("./utils/pendingWorkouts");

const { TOOLS }                  = require("./tools");
const { handleCriarTreino }      = require("./handlers/criar_treino");
const { handleSalvarTreino }     = require("./handlers/salvar_treino");
const { handleConsultarTreino }  = require("./handlers/consultar_treino");
const { handleDicasExercicio }     = require("./handlers/dicas_exercicio");
const { handleResponder }          = require("./handlers/responder");
const { handleAnalisarHistorico }  = require("./handlers/analisar_historico");
const { handleEditarTreino }       = require("./handlers/editar_treino");
const { handleCriarPeriodizacao }  = require("./handlers/criar_periodizacao");
const { handleCompararPeriodos }   = require("./handlers/comparar_periodos");

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL  = process.env.OPENAI_MODEL || "gpt-5.4";
const MAX_ITER = 6;

const SYSTEM_PROMPT = `Você é Hércules, treinador virtual do Atlanteon. Responda sempre em português.
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
- Responda de forma CURTA: apenas confirme o nome do treino e o dia. Não reescreva o treino, não repita exercícios, não adicione dicas. Uma linha é suficiente.

## Análise e feedback de progresso
Quando o usuário pedir feedback, análise, avaliação do progresso, ou perguntar se está evoluindo:
1. Chame analisar_historico para obter os dados reais das últimas 8 semanas
2. Com base nos dados retornados, analise e comente:
   - **Consistência:** média de dias treinados por semana — parabenize se ≥ 3, alerte se < 2
   - **Volume por grupo:** identifique grupos sobretreinados (> 20 séries/semana) e negligenciados (< 8 séries/semana ou ausentes)
   - **Progressão de carga:** destaque exercícios com tendência "subindo" (ótimo sinal), "estagnado" por 3+ semanas (sugira técnicas de sobrecarga progressiva) ou "caindo" (pode indicar fadiga ou técnica ruim)
   - **Desequilíbrios musculares:** ex: muita carga em peitoral e pouca em costas, ou pernas negligenciadas
3. Seja específico com números — cite os exercícios e cargas reais do usuário
4. Termine com 2–3 recomendações práticas e diretas

Use o contexto de "Músculos treinados esta semana" (disponível no início de cada conversa) para comentários rápidos sobre a semana atual sem precisar chamar analisar_historico.

## Edição de treinos existentes
Quando o usuário pedir para mudar, trocar, adicionar ou remover um exercício:
1. Chame editar_treino com a operação correta (substituir/adicionar/remover/alterar_series)
2. Confirme a alteração de forma curta: "Troquei X por Y no seu treino de {dia}."
3. Se o exercicio_novo não existir no banco, informe e sugira alternativas

## Periodização
Quando o usuário pedir um plano de semanas, progressão ou periodização:
1. Chame criar_periodizacao — retorna os treinos atuais com cargas recentes
2. Monte um plano semana a semana com variações de volume e intensidade
3. Linear: aumente carga 2-5% a cada semana, reduza volume na última (deload)
4. Ondulatória: alterne dias pesados (baixo volume, alta carga) e leves (alto volume, baixa carga)
5. Block: fase 1 = adaptação (alto volume), fase 2 = força (alta intensidade), fase 3 = pico

## Deload automático
Quando analisar_historico retornar sugerir_deload: true:
- Mencione proativamente que o usuário pode se beneficiar de uma semana de deload
- Explique: reduzir volume ~40-50% mantendo a carga, para recuperação e supercompensação
- Ofereça montar uma semana de deload específica para os treinos dele

## Comparação de períodos
Quando o usuário perguntar sobre evolução entre períodos:
1. Chame comparar_periodos com os dois períodos corretos
2. Destaque diferença em dias treinados, volume total, maiores cargas e cardio
3. Use % de variação quando relevante ("volume 18% maior que mês passado")

## Cardio no feedback
Quando os dados retornarem informações de cardio:
- Inclua no feedback: minutos semanais e modalidades praticadas
- Alerte se alto volume de cardio + musculação intensa indicar risco de overtraining`;


const HANDLERS = {
    criar_treino:       handleCriarTreino,
    salvar_treino:      handleSalvarTreino,
    consultar_treino:   handleConsultarTreino,
    dicas_exercicio:    handleDicasExercicio,
    analisar_historico: handleAnalisarHistorico,
    editar_treino:      handleEditarTreino,
    criar_periodizacao: handleCriarPeriodizacao,
    comparar_periodos:  handleCompararPeriodos,
    responder:          handleResponder,
};

const MAX_MENSAGEM = 2000;

// Todas as rotas do Hércules exigem login; o usuário vem SEMPRE do token
router.use(authenticate);

// Conversa existe e é do usuário? Devolve a conversa ou null.
async function conversaDoUsuario(conversaId, usuarioId) {
    if (!conversaId) return null;
    const { rows } = await pool.query(
        "SELECT id FROM hercules_conversas WHERE id = $1 AND usuario_id = $2",
        [conversaId, usuarioId]
    );
    return rows[0] || null;
}

// O treino gerado e ainda não salvo (pool de exercícios) fica no meta da
// última resposta do Hércules. Assim sobrevive a restart/deploy do servidor,
// em vez de existir só na memória do processo.
async function carregarPendente(conversaId, usuarioId) {
    if (!conversaId) return;
    const { rows } = await pool.query(
        `SELECT meta FROM hercules_mensagens
         WHERE conversa_id = $1 AND autor = 'hercules'
         ORDER BY criado_em DESC LIMIT 1`,
        [conversaId]
    );
    const pendente = rows[0]?.meta?.pendente;
    if (pendente) pendingWorkouts.set(String(usuarioId), pendente);
    else pendingWorkouts.delete(String(usuarioId));
}

async function salvarMensagem(usuarioId, conversaId, autor, texto, meta = null) {
    if (!conversaId) return;
    await pool.query(
        "INSERT INTO hercules_mensagens (usuario_id, autor, texto, meta, conversa_id) VALUES ($1, $2, $3, $4, $5)",
        [usuarioId, autor, texto, meta, conversaId]
    );
}

// ── POST /hercules/chat ──────────────────────────────────────────────────────
router.post("/chat", async (req, res) => {
    const usuarioId = parseInt(req.user.userId);
    const mensagem  = typeof req.body.mensagem === "string" ? req.body.mensagem.trim() : "";
    const conversa  = await conversaDoUsuario(req.body.conversaId, usuarioId);
    const conversaId = conversa?.id || null;

    if (!mensagem) return res.status(400).json({ erro: "Mensagem vazia." });
    if (mensagem.length > MAX_MENSAGEM) return res.status(400).json({ erro: "Mensagem muito longa." });

    // Responde e grava a resposta do Hércules (com o treino pendente, se houver)
    const responder = async (corpo) => {
        const pendente = pendingWorkouts.get(String(usuarioId)) || null;
        await salvarMensagem(usuarioId, conversaId, "hercules", corpo.texto, {
            acao: corpo.acao, treino_id: corpo.treino_id ?? null, pendente,
        }).catch(err => console.error("Erro ao salvar resposta do Hércules:", err.message));
        return res.json(corpo);
    };

    try {
        await carregarPendente(conversaId, usuarioId);

        // Histórico é lido ANTES de gravar a mensagem nova, para ela não
        // entrar duplicada no prompt
        const [userRes, historicoRows, musculosSemanaRes] = await Promise.all([
            pool.query("SELECT nome, objetivo, genero FROM usuarios WHERE id = $1", [usuarioId]),
            conversaId
                ? pool.query(
                    `SELECT autor, texto FROM hercules_mensagens
                     WHERE conversa_id = $1 ORDER BY criado_em DESC LIMIT 10`,
                    [conversaId]
                  )
                : Promise.resolve({ rows: [] }),
            pool.query(`
                SELECT e.grupo_muscular, COUNT(su.id)::int AS total_series
                FROM series_usuario su
                JOIN exercicios e ON e.id = su.exercicio_id
                WHERE su.usuario_id = $1
                  AND su.data_treino >= DATE_TRUNC('week', ${SQL_HOJE})
                  AND su.data_treino < DATE_TRUNC('week', ${SQL_HOJE}) + INTERVAL '1 week'
                GROUP BY e.grupo_muscular
                ORDER BY total_series DESC
            `, [usuarioId]),
        ]);

        await salvarMensagem(usuarioId, conversaId, "user", mensagem);

        const usuario     = userRes.rows[0] || {};
        const nomeUsuario = usuario.nome || "usuário";
        const historico   = historicoRows.rows.reverse().map(r => ({
            role:    r.autor === 'user' ? 'user' : 'assistant',
            content: r.texto,
        }));

        // ── Monta contexto dinâmico do usuário ──
        const perfilTexto = [
            usuario.objetivo ? `Objetivo: ${usuario.objetivo}` : null,
            usuario.genero   ? `Gênero: ${usuario.genero}`     : null,
        ].filter(Boolean).join(' | ') || null;

        const musculosSemana = musculosSemanaRes.rows;
        const mapaMusculosSemana = musculosSemana.length
            ? musculosSemana.map(r => `${r.grupo_muscular}: ${r.total_series} séries`).join(', ')
            : 'nenhum treino registrado ainda esta semana';

        const contextoUsuario = [
            `## Contexto do usuário`,
            `Nome: ${nomeUsuario}`,
            perfilTexto ? perfilTexto : null,
            `Músculos treinados esta semana: ${mapaMusculosSemana}`,
        ].filter(Boolean).join('\n');

        // ── Loop agentico ──────────────────────────────────────────────────
        const messages = [
            { role: "system", content: `${SYSTEM_PROMPT}\n\n${contextoUsuario}` },
            ...historico,
            { role: "user", content: mensagem },
        ];

        let ultimaAcao     = "outro";
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
                return responder({
                    acao:      ultimaAcao,
                    treino_id: ultimaTreinoId,
                    texto:     message.content || `👍 Pode me dizer mais detalhes, ${nomeUsuario}?`,
                });
            }

            // GPT enviou texto + tool_call juntos: executa a tool e retorna o texto como resposta final
            const textoJunto = message.content || null;
            let salvouComTexto = false;

            // A API exige uma resposta "tool" para CADA tool_call da mensagem
            for (const toolCall of message.tool_calls) {
                const functionName = toolCall.function.name;
                const handler      = HANDLERS[functionName];

                let toolResult;
                let args = null;
                try {
                    args = JSON.parse(toolCall.function.arguments || "{}");
                } catch {
                    toolResult = { erro: "Argumentos inválidos para a ferramenta." };
                }

                if (!toolResult) {
                    toolResult = handler
                        ? await handler({ args, usuarioId, nomeUsuario, pool, openai, model: MODEL })
                        : { erro: `Ferramenta '${functionName}' não encontrada` };
                }

                if (functionName === 'criar_treino') ultimaAcao = 'criar_treino';
                if (functionName === 'salvar_treino' && toolResult?.sucesso) {
                    ultimaAcao     = 'treino_salvo';
                    ultimaTreinoId = toolResult.treino_id;
                    if (textoJunto) salvouComTexto = true;
                }

                messages.push({
                    role:         "tool",
                    tool_call_id: toolCall.id,
                    content:      JSON.stringify(toolResult),
                });
            }

            // Se GPT enviou o treino em texto junto com a chamada de salvar, retorna já
            if (salvouComTexto) {
                return responder({ acao: 'treino_salvo', treino_id: ultimaTreinoId, texto: textoJunto });
            }
        }

        // Limite de iterações atingido
        return responder({ acao: "outro", texto: `⚠️ ${nomeUsuario}, não consegui completar a solicitação. Tente novamente.` });

    } catch (err) {
        console.error("Erro Hércules:", err);
        res.status(500).json({ erro: "Falha ao processar mensagem do Hércules" });
    }
});

// ── Histórico / Conversas ────────────────────────────────────────────────────

router.get("/historico/:conversaId", async (req, res) => {
    if (!(await conversaDoUsuario(req.params.conversaId, req.user.userId))) {
        return res.status(404).json({ erro: "Conversa não encontrada." });
    }
    const { rows } = await pool.query(
        "SELECT autor, texto, meta FROM hercules_mensagens WHERE conversa_id = $1 ORDER BY criado_em ASC",
        [req.params.conversaId]
    );
    // O pool de exercícios pendente é interno do servidor
    res.json(rows.map(r => {
        if (!r.meta?.pendente) return r;
        const { pendente, ...meta } = r.meta;
        return { ...r, meta };
    }));
});

router.get("/conversas/:usuarioId", requireSelf("usuarioId"), async (req, res) => {
    const { rows } = await pool.query(
        "SELECT id, titulo, criado_em FROM hercules_conversas WHERE usuario_id = $1 ORDER BY criado_em DESC",
        [req.params.usuarioId]
    );
    res.json(rows);
});

router.post("/conversas", async (req, res) => {
    const { titulo } = req.body;
    const { rows } = await pool.query(
        "INSERT INTO hercules_conversas (usuario_id, titulo) VALUES ($1, $2) RETURNING *",
        [req.user.userId, (typeof titulo === "string" && titulo.trim() ? titulo.trim() : "Nova conversa").substring(0, 80)]
    );
    res.json(rows[0]);
});

router.delete("/conversas/:id", async (req, res) => {
    await pool.query(
        "DELETE FROM hercules_conversas WHERE id = $1 AND usuario_id = $2",
        [req.params.id, req.user.userId]
    );
    res.json({ ok: true });
});

module.exports = router;
