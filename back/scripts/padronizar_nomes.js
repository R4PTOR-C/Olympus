/**
 * Padroniza os nomes dos exercícios usando GPT.
 * Corrige traduções ruins, termos inconsistentes e nomenclatura fora do padrão
 * de academias brasileiras.
 *
 * Uso:
 *   node back/scripts/padronizar_nomes.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const OpenAI = require('openai');
const pool   = require('../db');

const openai     = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL      = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const BATCH_SIZE = 40;

const SYSTEM = `Você é um especialista em nomenclatura de exercícios para academias brasileiras.
Revise os nomes dos exercícios fornecidos e corrija os que estiverem com problemas.

## Diretrizes de padronização:

**Equipamentos — use sempre esses termos:**
- "Polia" para exercícios em cabo/polia (não "Cabo", "Crossover", "Cable")
- "Halter" (não "Haltere", "Dumbbell", "DB")
- "Barra" para barra olímpica livre
- "Kettlebell" (manter em inglês, é o termo consagrado)
- "Faixa" para faixas elásticas de resistência (não "Banda", "Band", "Theraband")
- "Máquina" quando o exercício é feito em aparelho guiado

**Nomenclatura geral:**
- Nomes em português sempre que houver equivalente consagrado em academia brasileira
- Termos em inglês só quando não houver equivalente (ex: Kettlebell, Plank → Prancha)
- Title Case em todas as palavras (exceto preposições: "de", "com", "no", "na", "do", "da", "em")
- Remova redundâncias óbvias no nome
- Parentêses apenas quando necessário para distinguir variações (ex: "Puxada (Pegada Neutra)")

**Exemplos de correções esperadas:**
- "Rosca Direta Com Cable" → "Rosca Direta Na Polia"
- "Fly Com Dumbbell" → "Crucifixo Com Halter"
- "Lat Pulldown" → "Puxada Alta na Polia"
- "Crossover Com Cabo" → "Crossover na Polia"
- "Remada Sentada Com Corda (crossover)" → "Remada Sentada Com Corda na Polia"

## Formato de resposta (JSON exato):
{
  "exercicios": [
    { "id": 1, "nome_novo": "Nome Corrigido" },
    { "id": 2, "nome_novo": null }
  ]
}

Retorne "nome_novo": null para exercícios cujo nome já está correto.
Nunca omita um exercício da lista.`;

async function padronizarLote(lote) {
    const lista = lote
        .map(e => `- id ${e.id}: "${e.nome_exercicio}" (${e.grupo_muscular})`)
        .join('\n');

    const res = await openai.chat.completions.create({
        model: MODEL,
        messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user',   content: `Revise os nomes:\n\n${lista}` },
        ],
        response_format: { type: 'json_object' },
    });

    const data = JSON.parse(res.choices[0].message.content);
    return data.exercicios || [];
}

async function main() {
    console.log('🔍 Buscando exercícios...');

    const { rows: exercicios } = await pool.query(
        'SELECT id, nome_exercicio, grupo_muscular FROM exercicios ORDER BY id'
    );

    const total  = exercicios.length;
    const lotes  = Math.ceil(total / BATCH_SIZE);
    let   atualizados = 0;
    let   erros       = 0;

    console.log(`📦 ${total} exercícios em ${lotes} lote(s) de ${BATCH_SIZE}.\n`);

    for (let i = 0; i < lotes; i++) {
        const lote   = exercicios.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
        const inicio = i * BATCH_SIZE + 1;
        const fim    = Math.min((i + 1) * BATCH_SIZE, total);

        process.stdout.write(`Lote ${i + 1}/${lotes} (${inicio}–${fim})... `);

        try {
            const resultados = await padronizarLote(lote);
            let alterados = 0;

            for (const r of resultados) {
                if (!r.id || !r.nome_novo) continue;

                const original = lote.find(e => e.id === r.id);
                if (!original || original.nome_exercicio === r.nome_novo) continue;

                await pool.query(
                    'UPDATE exercicios SET nome_exercicio = $1 WHERE id = $2',
                    [r.nome_novo, r.id]
                );

                console.log(`\n  ✏️  [${r.id}] "${original.nome_exercicio}" → "${r.nome_novo}"`);
                alterados++;
                atualizados++;
            }

            if (alterados === 0) console.log('✅ sem alterações');
            else console.log(`✅ ${alterados} alterado(s)`);

        } catch (err) {
            console.log(`❌ Erro: ${err.message}`);
            erros++;
        }

        if (i < lotes - 1) await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\n🏁 Concluído: ${atualizados} nomes atualizados, ${erros} lote(s) com erro.`);
    process.exit(0);
}

main().catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
});
