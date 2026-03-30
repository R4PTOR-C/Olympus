require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs     = require('fs');
const path   = require('path');
const OpenAI = require('openai').default;
const db     = require('../db');

const OUTPUT_SQL = path.join(__dirname, 'retraduzir_updates.sql');
const BATCH_SIZE = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function traduzirLote(exercicios) {
    // Usa nome_original (inglês) se disponível, senão usa nome atual em português
    const lista = exercicios.map((e, i) => {
        const fonte = e.nome_original
            ? `${e.nome_original} [grupo: ${e.grupo_muscular}]`
            : `${e.nome_exercicio} [grupo: ${e.grupo_muscular}]`;
        return `${i + 1}. ${fonte}`;
    }).join('\n');

    const res = await openai.chat.completions.create({
        model: 'gpt-5.4',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'system',
                content:
                    'Você é um especialista em musculação e fitness brasileiro com profundo conhecimento de terminologia de academia. ' +
                    'Traduza ou corrija os nomes de exercícios para português brasileiro, usando a nomenclatura mais natural e reconhecível em academias do Brasil. ' +
                    'Diretrizes:\n' +
                    '- Use termos consagrados: "Supino", "Rosca", "Remada", "Puxada", "Agachamento", "Levantamento Terra", "Desenvolvimento", etc.\n' +
                    '- Mantenha em inglês apenas termos sem tradução estabelecida no Brasil: Plank, Burpee, Deadlift, Squat (se comum), Pullover, Crunch, etc.\n' +
                    '- Seja preciso com variações: pegada pronada/supinada, unilateral, inclinado/declinado, com barra/halter/cabo/máquina.\n' +
                    '- Capitalize apenas a primeira letra de cada palavra principal.\n' +
                    '- Responda com JSON: { "traducoes": [ { "index": 1, "nome": "..." }, ... ] }',
            },
            {
                role: 'user',
                content: lista,
            },
        ],
    });

    const json = JSON.parse(res.choices[0].message.content);
    return json.traducoes || [];
}

async function main() {
    const { rows } = await db.query(
        `SELECT id, nome_exercicio, nome_original, grupo_muscular
         FROM exercicios
         ORDER BY grupo_muscular, nome_exercicio`
    );
    console.log(`🗄️  ${rows.length} exercícios encontrados\n`);

    const updates = [];
    const erros   = [];

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch     = rows.slice(i, i + BATCH_SIZE);
        const loteNum   = Math.floor(i / BATCH_SIZE) + 1;
        const total     = Math.ceil(rows.length / BATCH_SIZE);
        process.stdout.write(`  Lote ${loteNum}/${total} (${batch[0].grupo_muscular})... `);

        try {
            const traducoes = await traduzirLote(batch);

            for (const t of traducoes) {
                const ex = batch[t.index - 1];
                if (!ex) continue;
                updates.push({ id: ex.id, nome_antigo: ex.nome_exercicio, nome_novo: t.nome });
            }

            // Exercícios sem resposta do GPT mantêm nome atual
            const respondidos = new Set(traducoes.map(t => t.index));
            for (let j = 1; j <= batch.length; j++) {
                if (!respondidos.has(j)) {
                    const ex = batch[j - 1];
                    updates.push({ id: ex.id, nome_antigo: ex.nome_exercicio, nome_novo: ex.nome_exercicio });
                }
            }

            console.log(`✅ ${traducoes.length}/${batch.length}`);
        } catch (err) {
            console.log(`❌ ${err.message}`);
            erros.push(...batch.map(e => e.id));
            // mantém nome atual para os que falharam
            for (const ex of batch) {
                updates.push({ id: ex.id, nome_antigo: ex.nome_exercicio, nome_novo: ex.nome_exercicio });
            }
        }
    }

    // Gera SQL
    const linhas = [
        `-- Retradução gerada em ${new Date().toISOString()}`,
        `-- Total: ${updates.length} exercícios`,
        `-- Erros de API: ${erros.length}`,
        '',
    ];

    for (const u of updates) {
        if (u.nome_antigo === u.nome_novo) {
            linhas.push(`-- SEM MUDANÇA: [${u.id}] "${u.nome_antigo}"`);
        } else {
            linhas.push(`-- [${u.id}] "${u.nome_antigo}" → "${u.nome_novo}"`);
            linhas.push(`UPDATE exercicios SET nome_exercicio = '${u.nome_novo.replace(/'/g, "''")}' WHERE id = ${u.id};`);
        }
    }

    fs.writeFileSync(OUTPUT_SQL, linhas.join('\n'), 'utf-8');

    const alterados = updates.filter(u => u.nome_antigo !== u.nome_novo).length;
    console.log(`\n─────────────────────────────────────`);
    console.log(`✅ Alterados:  ${alterados}`);
    console.log(`➖ Sem mudança: ${updates.length - alterados}`);
    console.log(`❌ Erros API:  ${erros.length}`);
    console.log(`📄 SQL: ${OUTPUT_SQL}\n`);

    process.exit(0);
}

main();
