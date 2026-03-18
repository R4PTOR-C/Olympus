---
name: Recent Changes This Session
description: Summary of all changes made in the current session
type: project
---

Mudanças realizadas na sessão de 2026-03-18:

**Why:** Sessão de melhorias e refatorações no Olympus.

**How to apply:** Tudo já está implementado. Referência para próximas sessões.

### Avatar / Foto de perfil
- `back/usuarios.js` — novo endpoint `DELETE /usuarios/:id/avatar` (seta avatar = NULL)
- `front/src/views/usuarios/Usuarios_edit.js` — botão "Remover foto" + handler `handleRemoverAvatar`
- `front/src/styles/UsuariosEdit.css` — estilo `.ue-avatar-remove-btn`
- `front/src/views/components/navbar.js` — placeholder SVG quando sem foto (removido `/default-avatar.png`)
- `front/src/styles/Navbar.css` — `.navbar-avatar-placeholder`

### App.css
- Reescrito alinhado ao design system moderno (tokens `--color-*` atualizados, dark mode com cores corretas `#0B0F14`, `#111720`, etc.)
- Código morto removido (`.App-logo`, `.App-header`, `.card-flutuante`, etc.)

### NavbarInferior
- Keyboard detection agora só esconde navbar na tela do Hércules (`if (keyboardOpen && herculesActive)`)

### Documentação
- `FUNCIONALIDADES.md` criado na raiz do projeto — documentação user-facing de todas as features

### Hércules — Migração para arquitetura modular
- `back/hercules.js` — virou apenas re-export de `./hercules/index`
- `back/hercules/index.js` — router principal + dispatcher + `resolverAgendamento` + rotas de histórico/conversas
- `back/hercules/tools.js` — 4 tools: `criar_treino`, `consultar_treino`, `dicas_exercicio`, `responder`
- `back/hercules/handlers/criar_treino.js` — lógica de criação de treino
- `back/hercules/handlers/consultar_treino.js` — consulta treinos por dia
- `back/hercules/handlers/dicas_exercicio.js` — dicas via GPT (era stub)
- `back/hercules/handlers/responder.js` — cumprimentos e fora de escopo
- `back/hercules/utils/dias.js` — utilitários de dias da semana
- `back/hercules/utils/grupos.js` — normalização de grupos musculares
- `back/hercules/utils/treino.js` — `salvarTreinoDoHercules` com transaction

### Hércules — Melhoria na qualidade de exercícios
- Pool de 12 exercícios por grupo (com `nivel` e `tipo` do banco)
- Exercícios feitos nos últimos 14 dias marcados com ⚠️ no prompt
- Perfil do usuário (`objetivo`, `genero`) incluído no contexto do GPT
- GPT decide livremente quantos exercícios por grupo (removido `quantidade_por_grupo` hardcoded)
- Prompt rico: `dica` obrigatória por exercício, `descanso`, `aquecimento`, `variacoes`, `resumo` markdown
- Total alvo: 6–10 exercícios por treino

### Script de classificação de exercícios
- `back/scripts/classificar_exercicios.js` — classifica `nivel` e `tipo` de todos os exercícios via GPT
- Processa em lotes de 60 com pausa de 1s entre lotes
- Pré-requisito: `ALTER TABLE exercicios ADD COLUMN tipo VARCHAR(20);`
