function handleResponder({ args }) {
    return {
        acao: args.fora_de_escopo ? "fora_de_escopo" : "outro",
        texto: args.fora_de_escopo
            ? "⚠️ Só posso ajudar com treinos e exercícios físicos."
            : args.texto,
    };
}

module.exports = { handleResponder };
