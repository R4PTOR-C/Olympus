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
            name: "editar_treino",
            description: "Edita um treino existente do usuário: substitui, adiciona, remove exercícios ou altera séries/reps. Use quando o usuário pedir para trocar, mudar, adicionar ou remover um exercício de um treino.",
            parameters: {
                type: "object",
                properties: {
                    dia_semana: {
                        type: "string",
                        enum: ["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"],
                        description: "Dia da semana do treino a editar.",
                    },
                    operacao: {
                        type: "string",
                        enum: ["substituir", "adicionar", "remover", "alterar_series"],
                        description: "Operação: substituir (troca um exercício por outro), adicionar (inclui novo), remover (exclui um), alterar_series (muda séries/reps).",
                    },
                    exercicio_atual: {
                        type: "string",
                        description: "Nome do exercício a ser removido/substituído/alterado.",
                    },
                    exercicio_novo: {
                        type: "string",
                        description: "Nome do novo exercício (para substituir ou adicionar).",
                    },
                    series: { type: "integer", description: "Número de séries." },
                    reps:   { type: "integer", description: "Número de repetições." },
                },
                required: ["dia_semana", "operacao"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "criar_periodizacao",
            description: "Cria um plano de periodização de treino de múltiplas semanas (4, 6, 8 ou 12 semanas) com progressão de carga e volume. Use quando o usuário pedir um plano de evolução, periodização ou progressão.",
            parameters: {
                type: "object",
                properties: {
                    semanas: {
                        type: "integer",
                        enum: [4, 6, 8, 12],
                        description: "Duração do plano em semanas.",
                    },
                    tipo: {
                        type: "string",
                        enum: ["linear", "ondulatória", "block"],
                        description: "Tipo de periodização. Linear: aumento gradual de carga. Ondulatória: varia volume/intensidade por sessão. Block: fases distintas de adaptação.",
                    },
                },
                required: ["semanas"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "comparar_periodos",
            description: "Compara o desempenho do usuário entre dois períodos: volume, consistência, cargas e cardio. Use quando perguntar como foi este mês vs o anterior, esta semana vs a passada, ou qualquer comparação temporal.",
            parameters: {
                type: "object",
                properties: {
                    periodo1: {
                        type: "string",
                        enum: ["esta_semana","semana_passada","este_mes","mes_passado","ultimas_4_semanas","ultimas_8_semanas"],
                        description: "Primeiro período (mais recente).",
                    },
                    periodo2: {
                        type: "string",
                        enum: ["esta_semana","semana_passada","este_mes","mes_passado","ultimas_4_semanas","ultimas_8_semanas"],
                        description: "Segundo período (para comparar).",
                    },
                },
                required: ["periodo1", "periodo2"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "analisar_historico",
            description: "Analisa o histórico de treinos do usuário nas últimas 8 semanas. Retorna volume por grupo muscular, progressão de carga por exercício, consistência semanal e tendências. Use quando o usuário pedir feedback, análise, avaliação do progresso ou perguntar se está evoluindo.",
            parameters: {
                type: "object",
                properties: {},
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
