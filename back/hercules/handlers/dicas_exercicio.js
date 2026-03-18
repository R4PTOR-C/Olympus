const SYSTEM_DICAS = `Você é Hércules, personal trainer especializado em hipertrofia. Responda em português com markdown.

Estrutura da resposta:
- **Título** com o nome do exercício
- **Como executar** (passo a passo numerado)
- **Erros comuns** a evitar
- **Dica de variação ou progressão**

Seja direto e prático. Máximo 250 palavras.`;

async function handleDicasExercicio({ args, openai, model }) {
    const { exercicio, aspecto } = args;

    const pergunta = aspecto
        ? `Me dê dicas de ${aspecto} para o exercício: ${exercicio}.`
        : `Me dê dicas de execução e técnica para o exercício: ${exercicio}.`;

    const res = await openai.chat.completions.create({
        model,
        messages: [
            { role: "system", content: SYSTEM_DICAS },
            { role: "user",   content: pergunta },
        ],
    });

    return {
        acao: "dicas_exercicio",
        texto: res.choices[0].message.content,
    };
}

module.exports = { handleDicasExercicio };
