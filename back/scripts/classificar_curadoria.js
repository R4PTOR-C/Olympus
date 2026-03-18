/**
 * Classifica destaque, aprovado_geracao e ambiente de todos os exercícios
 * usando GPT em lotes de 40.
 *
 * Uso:
 *   node back/scripts/classificar_curadoria.js
 *
 * Campos:
 *   destaque          → true se é exercício clássico e mainstream de academia brasileira
 *   aprovado_geracao  → false se não deve entrar em treinos gerados (funcional, calistenia avançada, etc.)
 *   ambiente          → 'academia' | 'funcional' | 'calistenia' | 'casa' | 'reabilitacao'
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const OpenAI = require('openai');
const pool   = require('../db');

const openai     = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL      = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const BATCH_SIZE = 40;

const SYSTEM = `Você é um especialista em musculação e academias brasileiras.
Classifique cada exercício com os três campos abaixo.

## destaque (boolean)
true → exercício clássico, amplamente praticado em academias brasileiras comuns.
Exemplos true: Supino com Barra, Agachamento Livre, Remada Curvada com Barra, Puxada Alta na Polia, Rosca Direta, Desenvolvimento com Barra, Leg Press, Stiff.
Exemplos false: variações obscuras, exercícios com toalha, movimentos muito nichados.

## aprovado_geracao (boolean)
false → não deve entrar em treinos gerados para academia comum.
Marque false quando:
- Exercício é de calistenia avançada (Back Lever, Muscle Up, Front Lever, Skin the Cat)
- Usa equipamentos raros ou improvisados (toalha, corda de escalada, bola medicinal como exercício principal)
- É de reabilitação ou fisioterapia
- Não faz sentido no grupo muscular classificado (ex: Hip Thruster classificado como Costas)
- Nome sugere contexto funcional/esportivo fora da academia (slam, lançamento, escalada)

## ambiente (string)
Escolha apenas um:
- "academia"      → executado com equipamentos padrão de academia (barras, halteres, máquinas, polias)
- "funcional"     → treino funcional, circuito, bola medicinal, TRX, movimentos esportivos
- "calistenia"    → peso corporal avançado, barras de rua, anéis (barra fixa simples = academia)
- "casa"          → pode ser feito em casa sem equipamento ou com faixa/halter leve
- "reabilitacao"  → fisioterapia, mobilidade, movimento terapêutico

## Regras importantes:
- Barra fixa simples = academia (não calistenia)
- Exercícios com faixa elástica simples podem ser academia ou casa dependendo do contexto
- Dê atenção ao grupo muscular — se o exercício não faz sentido no grupo, aproved_geracao = false

## Formato de resposta (JSON exato):
{
  "exercicios": [
    { "id": 1, "destaque": true,  "aprovado_geracao": true,  "ambiente": "academia" },
    { "id": 2, "destaque": false, "aprovado_geracao": false, "ambiente": "calistenia" }
  ]
}

Nunca omita um exercício da lista.`;

async function classificarLote(lote) {
    const lista = lote
        .map(e => `- id ${e.id}: "${e.nome_exercicio}" (${e.grupo_muscular})`)
        .join('\n');

    const res = await openai.chat.completions.create({
        model: MODEL,
        messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user',   content: `Classifique os exercícios:\n\n${lista}` },
        ],
        response_format: { type: 'json_object' },
    });

    const data = JSON.parse(res.choices[0].message.content);
    return data.exercicios || [];
}

async function main() {
    console.log('🔍 Buscando exercícios para classificar...');

    const { rows: exercicios } = await pool.query(
        `SELECT id, nome_exercicio, grupo_muscular
         FROM exercicios
         WHERE destaque IS NULL
            OR destaque = FALSE AND aprovado_geracao = TRUE AND ambiente = 'academia'
         ORDER BY id`
    );

    // Re-classifica todos (colunas têm default, então todos precisam ser revisados)
    const { rows: todos } = await pool.query(
        'SELECT id, nome_exercicio, grupo_muscular FROM exercicios ORDER BY id'
    );

    const total  = todos.length;
    const lotes  = Math.ceil(total / BATCH_SIZE);
    let   atualizados = 0;
    let   erros       = 0;

    console.log(`📦 ${total} exercícios em ${lotes} lote(s) de ${BATCH_SIZE}.\n`);

    for (let i = 0; i < lotes; i++) {
        const lote   = todos.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
        const inicio = i * BATCH_SIZE + 1;
        const fim    = Math.min((i + 1) * BATCH_SIZE, total);

        process.stdout.write(`Lote ${i + 1}/${lotes} (${inicio}–${fim})... `);

        try {
            const classificacoes = await classificarLote(lote);

            for (const c of classificacoes) {
                if (!c.id) continue;
                await pool.query(
                    `UPDATE exercicios
                     SET destaque = $1, aprovado_geracao = $2, ambiente = $3
                     WHERE id = $4`,
                    [c.destaque ?? false, c.aprovado_geracao ?? true, c.ambiente ?? 'academia', c.id]
                );
                atualizados++;
            }

            console.log(`✅ ${classificacoes.length} classificados`);
        } catch (err) {
            console.log(`❌ Erro: ${err.message}`);
            erros++;
        }

        if (i < lotes - 1) await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\n🏁 Concluído: ${atualizados} atualizados, ${erros} lote(s) com erro.`);
    process.exit(0);
}

main().catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
});
