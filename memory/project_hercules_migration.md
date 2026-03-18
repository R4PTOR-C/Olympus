---
name: Hercules Migration to Function Calling
description: Hercules backend was migrated from monolithic hercules.js to modular structure using OpenAI Function Calling
type: project
---

Hercules foi migrado de um único arquivo `back/hercules.js` (970 linhas) para estrutura modular com Function Calling.

**Why:** Arquivo estava crescendo muito e ainda faltavam funcionalidades. Function Calling elimina prompt gigante de classificação e torna adição de features simples.

**How to apply:** Para adicionar nova feature ao Hércules: criar handler em `back/hercules/handlers/`, adicionar tool em `back/hercules/tools.js`, registrar no objeto HANDLERS em `back/hercules/index.js`.

### Estrutura atual:
```
back/
  hercules.js              ← re-exporta hercules/index.js (server.js não muda)
  hercules/
    index.js               ← router + dispatcher
    tools.js               ← 4 tools: criar_treino, consultar_treino, dicas_exercicio, responder
    handlers/
      criar_treino.js      ← busca pool, GPT seleciona, agendamento
      consultar_treino.js  ← consulta por dia ou listagem
      dicas_exercicio.js   ← call GPT com prompt específico de dicas
      responder.js         ← cumprimentos e fora de escopo
    utils/
      dias.js              ← normalizarDia, buscarDiasLivres, etc.
      grupos.js            ← aliases, normalizarGrupoMuscular, etc.
      treino.js            ← salvarTreinoDoHercules
```

### Model:
`process.env.OPENAI_MODEL || "gpt-5-mini"` — usuário confirmou que gpt-5-mini funciona.
