require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs     = require('fs');
const path   = require('path');
const OpenAI = require('openai').default;
const db     = require('../db');

// ── CAMINHOS ────────────────────────────────────────────────────────────────
const JSON_FILE    = '/mnt/c/Users/rafae/OneDrive/Documentos/dataset exercicios/desktop/exerciseData_complete.json';
const OUTPUT_SQL   = path.join(__dirname, 'match_updates.sql');
const OUTPUT_LOG   = path.join(__dirname, 'match_sem_resultado.json');

const BATCH_SIZE = 80;

// ── OPENAI ────────────────────────────────────────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── MAPEAMENTO grupo muscular → bodyPart/target do dataset ───────────────────
const GRUPO_TO_TAGS = {
    'Peitoral':    ['chest', 'pectorals', 'serratus anterior'],
    'Bíceps':      ['upper arms', 'biceps'],
    'Tríceps':     ['upper arms', 'triceps'],
    'Ombros':      ['shoulders', 'delts'],
    'Abdômen':     ['waist', 'abs'],
    'Pernas':      ['upper legs', 'lower legs', 'quads', 'hamstrings', 'glutes', 'adductors', 'abductors', 'calves'],
    'Panturrilha': ['lower legs', 'calves'],
    'Costas':      ['back', 'lats', 'upper back', 'traps', 'spine', 'levator scapulae', 'neck'],
    'Cardio':      ['cardio', 'cardiovascular system'],
    'Antebraço':   ['lower arms', 'forearms'],
};

// ── MATCH via GPT ─────────────────────────────────────────────────────────────
async function matchLote(ptBatch, enList) {
    const ptBlock = ptBatch.map((r, i) => `${i + 1}. [banco_id=${r.id}] ${r.nome_exercicio}`).join('\n');
    const enBlock = enList.map(e => `- [dataset_id=${e.id}] ${e.name}`).join('\n');

    const res = await openai.chat.completions.create({
        model: 'gpt-5.4',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'system',
                content:
                    'Você é um especialista em exercícios físicos. ' +
                    'Dado uma lista de exercícios em português (com banco_id) e uma lista em inglês (com dataset_id), ' +
                    'encontre a correspondência semântica mais provável para cada exercício em português. ' +
                    'Responda SOMENTE com JSON no formato: ' +
                    '{ "matches": [ { "banco_id": 123, "dataset_id": "0458", "nome_original": "floor fly (with barbell)", "confianca": "alta|media|baixa" } ] } ' +
                    'Se não encontrar correspondência clara, omita o item da lista.',
            },
            {
                role: 'user',
                content: `EXERCÍCIOS EM PORTUGUÊS (banco):\n${ptBlock}\n\nEXERCÍCIOS EM INGLÊS (dataset):\n${enBlock}`,
            },
        ],
    });

    const json = JSON.parse(res.choices[0].message.content);
    return json.matches || [];
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
    const dataset = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));
    console.log(`📋 Dataset: ${dataset.length} exercícios`);

    // Índice do dataset por bodyPart e target
    const datasetPorTag = {};
    for (const ex of dataset) {
        const tags = [ex.bodyPart?.toLowerCase(), ex.target?.toLowerCase()].filter(Boolean);
        for (const tag of tags) {
            if (!datasetPorTag[tag]) datasetPorTag[tag] = [];
            datasetPorTag[tag].push(ex);
        }
    }

    // Busca todos os exercícios do banco
    const { rows: bancoDB } = await db.query(
        'SELECT id, nome_exercicio, grupo_muscular FROM exercicios ORDER BY grupo_muscular, nome_exercicio'
    );
    console.log(`🗄️  Banco: ${bancoDB.length} exercícios\n`);

    const allMatches = [];
    const semMatch   = [];

    // Agrupa banco por grupo_muscular
    const porGrupo = {};
    for (const row of bancoDB) {
        const g = row.grupo_muscular || 'Outros';
        if (!porGrupo[g]) porGrupo[g] = [];
        porGrupo[g].push(row);
    }

    for (const [grupo, exercicios] of Object.entries(porGrupo)) {
        const tags   = GRUPO_TO_TAGS[grupo] || [];
        const enList = [...new Map(
            tags.flatMap(t => datasetPorTag[t] || []).map(e => [e.id, e])
        ).values()];

        if (enList.length === 0) {
            console.log(`⚠️  ${grupo}: sem exercícios correspondentes no dataset`);
            semMatch.push(...exercicios.map(e => ({ ...e, motivo: 'grupo sem match no dataset' })));
            continue;
        }

        console.log(`\n🏋️  ${grupo}: ${exercicios.length} no banco × ${enList.length} no dataset`);

        // Processa em lotes
        for (let i = 0; i < exercicios.length; i += BATCH_SIZE) {
            const batch     = exercicios.slice(i, i + BATCH_SIZE);
            const loteNum   = Math.floor(i / BATCH_SIZE) + 1;
            const totalLotes = Math.ceil(exercicios.length / BATCH_SIZE);
            process.stdout.write(`  Lote ${loteNum}/${totalLotes}... `);

            try {
                const matches = await matchLote(batch, enList);
                allMatches.push(...matches);
                const matchedIds = new Set(matches.map(m => m.banco_id));
                const naoMatchados = batch.filter(e => !matchedIds.has(e.id));
                semMatch.push(...naoMatchados.map(e => ({ ...e, motivo: 'GPT não encontrou correspondência' })));
                console.log(`✅ ${matches.length}/${batch.length} matched`);
            } catch (err) {
                console.log(`❌ Erro: ${err.message}`);
                semMatch.push(...batch.map(e => ({ ...e, motivo: `erro: ${err.message}` })));
            }
        }
    }

    // ── Gera SQL de UPDATE ──
    const alta  = allMatches.filter(m => m.confianca === 'alta');
    const media = allMatches.filter(m => m.confianca === 'media');
    const baixa = allMatches.filter(m => m.confianca === 'baixa');

    const linhasSQL = [
        `-- Gerado em ${new Date().toISOString()}`,
        `-- Total: ${allMatches.length} matches (alta: ${alta.length}, média: ${media.length}, baixa: ${baixa.length})`,
        `-- Sem match: ${semMatch.length}`,
        '',
        '-- ═══ ALTA CONFIANÇA ════════════════════════════════════════════════════',
        ...alta.map(m =>
            `UPDATE exercicios SET dataset_id = '${m.dataset_id}', nome_original = '${m.nome_original.replace(/'/g, "''")}' WHERE id = ${m.banco_id};`
        ),
        '',
        '-- ═══ MÉDIA CONFIANÇA (revisar antes de executar) ═══════════════════════',
        ...media.map(m =>
            `-- UPDATE exercicios SET dataset_id = '${m.dataset_id}', nome_original = '${m.nome_original.replace(/'/g, "''")}' WHERE id = ${m.banco_id};`
        ),
        '',
        '-- ═══ BAIXA CONFIANÇA (comentado por segurança) ═════════════════════════',
        ...baixa.map(m =>
            `-- UPDATE exercicios SET dataset_id = '${m.dataset_id}', nome_original = '${m.nome_original.replace(/'/g, "''")}' WHERE id = ${m.banco_id};`
        ),
    ];

    fs.writeFileSync(OUTPUT_SQL, linhasSQL.join('\n'), 'utf-8');
    fs.writeFileSync(OUTPUT_LOG, JSON.stringify(semMatch, null, 2), 'utf-8');

    console.log(`\n─────────────────────────────────────────────`);
    console.log(`✅ Alta confiança:   ${alta.length}`);
    console.log(`⚠️  Média confiança: ${media.length}`);
    console.log(`🔴 Baixa confiança:  ${baixa.length}`);
    console.log(`❌ Sem match:        ${semMatch.length}`);
    console.log(`─────────────────────────────────────────────`);
    console.log(`📄 SQL gerado:  ${OUTPUT_SQL}`);
    console.log(`📋 Sem match:   ${OUTPUT_LOG}\n`);

    process.exit(0);
}

main();
