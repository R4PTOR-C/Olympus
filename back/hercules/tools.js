const GRUPOS_VALIDOS = [
    "Peitoral", "Costas", "Ombros", "Bíceps", "Tríceps",
    "Pernas", "Panturrilha", "Abdômen",
];

const DIAS_VALIDOS = [
    "domingo", "segunda-feira", "terça-feira", "quarta-feira",
    "quinta-feira", "sexta-feira", "sábado",
];

const TOOLS = [
    {
        type: "function",
        function: {
            name: "criar_treino",
            description: "Cria um novo treino personalizado com exercícios do banco. Use quando o usuário pedir para montar, criar ou sugerir um treino.",
            parameters: {
                type: "object",
                properties: {
                    grupos_musculares: {
                        type: "array",
                        items: { type: "string", enum: GRUPOS_VALIDOS },
                        description: "Grupos musculares a treinar. Full body = todos os 7 grupos principais.",
                    },
                    series_reps_por_grupo: {
                        type: "object",
                        description: "Séries x reps por grupo (ex: '4x10'). Peitoral/Costas/Ombros/Pernas: 4x10. Bíceps/Tríceps/Panturrilha: 3x12. Abdômen: 3x20.",
                        additionalProperties: { type: "string" },
                    },
                    nome: {
                        type: "string",
                        description: "Nome do treino. Ex: 'Treino Full Body', 'Treino de Costas', 'Treino de Pernas'.",
                    },
                    exercicios_obrigatorios: {
                        type: "array",
                        items: { type: "string" },
                        description: "Exercícios que o usuário pediu explicitamente para incluir no treino. Ex: ['Barra Fixa', 'Remada Curvada com Barra'].",
                    },
                    dia_semana: {
                        type: "string",
                        enum: DIAS_VALIDOS,
                        description: "Dia da semana para o treino, se o usuário especificou.",
                    },
                },
                required: ["grupos_musculares", "nome"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "consultar_treino",
            description: "Consulta os treinos cadastrados do usuário. Use quando perguntar sobre treino de um dia específico ou quais dias tem treino.",
            parameters: {
                type: "object",
                properties: {
                    dia_semana: {
                        type: "string",
                        enum: DIAS_VALIDOS,
                        description: "Dia a consultar. Omitir para listar todos os dias com treino.",
                    },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "dicas_exercicio",
            description: "Fornece dicas de execução, técnica e postura para exercícios. Use quando o usuário pedir explicação, dica ou como executar um exercício.",
            parameters: {
                type: "object",
                properties: {
                    exercicio: {
                        type: "string",
                        description: "Nome do exercício.",
                    },
                    aspecto: {
                        type: "string",
                        description: "Aspecto específico: execução, postura, erros comuns, variações. Padrão: execução geral.",
                    },
                },
                required: ["exercicio"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "salvar_treino",
            description: "Salva o treino no banco de dados. Use após criar_treino, passando os exercícios selecionados da lista disponível.",
            parameters: {
                type: "object",
                properties: {
                    dia_semana: {
                        type: "string",
                        enum: DIAS_VALIDOS,
                        description: "Dia da semana para salvar o treino.",
                    },
                    nome: {
                        type: "string",
                        description: "Nome do treino. Ex: 'Treino de Costas', 'Push Day'.",
                    },
                    exercicios: {
                        type: "array",
                        description: "Exercícios selecionados da lista disponível, em ordem de execução.",
                        items: {
                            type: "object",
                            properties: {
                                nome:   { type: "string",  description: "Nome exato do exercício conforme a lista." },
                                series: { type: "integer", description: "Número de séries." },
                                reps:   { type: "integer", description: "Número de repetições (valor mais alto se for range)." },
                            },
                            required: ["nome", "series", "reps"],
                        },
                    },
                },
                required: ["dia_semana", "exercicios"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "responder",
            description: "Responde cumprimentos, perguntas gerais sobre fitness ou redireciona assuntos fora de escopo.",
            parameters: {
                type: "object",
                properties: {
                    texto: {
                        type: "string",
                        description: "Resposta em português.",
                    },
                    fora_de_escopo: {
                        type: "boolean",
                        description: "True se o pedido não tem relação com treino ou fitness.",
                    },
                },
                required: ["texto"],
            },
        },
    },
];

module.exports = { TOOLS };
