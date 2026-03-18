/**
 * Classifica automaticamente `nivel` e `tipo` de todos os exercícios
 * usando GPT-5-mini em lotes de 60.
 *
 * Uso:
 *   node back/scripts/classificar_exercicios.js
 *
 * Pré-requisito:
 *   ALTER TABLE exercicios ADD COLUMN tipo VARCHAR(20);
 *
 * nivel → 'Iniciante' | 'Intermediário' | 'Avançado'
 * tipo  → 'Composto'  | 'Isolamento'
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const OpenAI = require('openai');
const pool   = require('../db');

const openai     = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL      = process.env.OPENAI_MODEL || 'gpt-5-mini';
const BATCH_SIZE = 60;

const SYSTEM = `Você é um especialista em musculação. Classifique cada exercício fornecido com:

- "nivel": "Iniciante", "Intermediário" ou "Avançado"
  - Iniciante: movimentos simples, máquinas guiadas, sem técnica complexa
  - Intermediário: requer coordenação e alguma experiência (halteres livres, cabos)
  - Avançado: técnica complexa, instabilidade, olímpicos, unilaterais difíceis

- "tipo": "Composto" ou "Isolamento"
  - Composto: envolve múltiplas articulações (supino, agachamento, remada, desenvolvimento)
  - Isolamento: envolve uma articulação principal (rosca direta, extensão de tríceps, crucifixo)

Retorne JSON no formato:
{
  "exercicios": [
    { "id": 1, "nivel": "Intermediário", "tipo": "Composto" },
    ...
  ]
}

Classifique com base no nome e grupo muscular. Nunca omita um exercício da lista.`;

async function classificarLote(lote) {
    const lista = lote
        .map(e => `- id ${e.id}: ${e.nome_exercicio} (${e.grupo_muscular})`)
        .join('\n');

    const res = await openai.chat.completions.create({
        model: MODEL,
        messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user',   content: `Classifique os seguintes exercícios:\n\n${lista}` },
        ],
        response_format: { type: 'json_object' },
    });

    const data = JSON.parse(res.choices[0].message.content);
    return data.exercicios || [];
}

async function main() {
    console.log('🔍 Buscando exercícios sem classificação...');

    const { rows: exercicios } = await pool.query(
        `SELECT id, nome_exercicio, grupo_muscular
         FROM exercicios
         WHERE nivel IS NULL OR tipo IS NULL
         ORDER BY id`
    );

    if (exercicios.length === 0) {
        console.log('✅ Todos os exercícios já estão classificados.');
        await pool.end();
        return;
    }

    const total  = exercicios.length;
    const lotes  = Math.ceil(total / BATCH_SIZE);
    let   atualizados = 0;
    let   erros       = 0;

    console.log(`📦 ${total} exercícios para classificar em ${lotes} lote(s) de ${BATCH_SIZE}.\n`);

    for (let i = 0; i < lotes; i++) {
        const lote    = exercicios.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
        const inicio  = i * BATCH_SIZE + 1;
        const fim     = Math.min((i + 1) * BATCH_SIZE, total);

        process.stdout.write(`Lote ${i + 1}/${lotes} (exercícios ${inicio}–${fim})... `);

        try {
            const classificacoes = await classificarLote(lote);

            for (const c of classificacoes) {
                if (!c.id || !c.nivel || !c.tipo) continue;
                await pool.query(
                    `UPDATE exercicios SET nivel = $1, tipo = $2 WHERE id = $3`,
                    [c.nivel, c.tipo, c.id]
                );
                atualizados++;
            }

            console.log(`✅ ${classificacoes.length} classificados`);
        } catch (err) {
            console.log(`❌ Erro: ${err.message}`);
            erros++;
        }

        // Pausa entre lotes para não estourar rate limit
        if (i < lotes - 1) await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\n🏁 Concluído: ${atualizados} atualizados, ${erros} lote(s) com erro.`);
    await pool.end();
}

main().catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
});
