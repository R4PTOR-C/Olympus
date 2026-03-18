---
name: Hercules Exercise Selection Quality Improvements
description: Improvements made to Hercules exercise selection to produce better quality workouts
type: project
---

Melhorias implementadas no `criar_treino.js` para aproximar qualidade do ChatGPT.

**Why:** Usuário comparou resposta do ChatGPT (treino de perna completo com dicas, descanso, variações) com Hércules e queria o mesmo nível.

**How to apply:** O handler já está atualizado. Futuras melhorias devem manter a filosofia de dar contexto rico ao GPT e deixar ele decidir com inteligência.

### O que foi implementado:

1. **Perfil do usuário** — `objetivo` e `genero` são buscados do banco e passados ao GPT
2. **Histórico recente** — exercícios dos últimos 14 dias marcados com ⚠️ no prompt para GPT priorizar variedade
3. **Metadados de exercícios** — `nivel` e `tipo` (Composto/Isolamento) incluídos na lista enviada ao GPT
4. **GPT decide volume** — removido `quantidade_por_grupo` hardcoded. GPT recebe pool de 12 exercícios por grupo e decide quantos usar de cada (total 6-10)
5. **Prompt rico** — GPT agora retorna `dica` por exercício, `descanso` diferenciado, `aquecimento`, `variacoes` personalizadas

### Script de classificação:
`back/scripts/classificar_exercicios.js` — classifica `nivel` e `tipo` de todos os exercícios via GPT em lotes de 60. Pré-requisito: `ALTER TABLE exercicios ADD COLUMN tipo VARCHAR(20);`
O script estava rodando durante a sessão (1200+ exercícios).
