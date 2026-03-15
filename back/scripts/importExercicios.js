require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs         = require('fs');
const path       = require('path');
const OpenAI     = require('openai').default;
const cloudinary = require('../config/cloudinary');
const db         = require('../db');

// ── CAMINHOS ────────────────────────────────────────────────────────────────
const JSON_FILE = '/mnt/c/Users/rafae/Downloads/desktop/desktop/exerciseData_complete.json';
const GIFS_DIR  = '/mnt/c/Users/rafae/Downloads/desktop/desktop/720';

const BATCH_SIZE = 50; // exercícios por chamada ao GPT

// ── OPENAI ────────────────────────────────────────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function traduzirLote(nomes) {
    const lista = nomes.map((n, i) => `${i + 1}. ${n}`).join('\n');

    const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        messages: [
            {
                role: 'system',
                content:
                    'Você é um especialista em musculação e fitness brasileiro. ' +
                    'Traduza os nomes de exercícios do inglês para o português brasileiro ' +
                    'usando a terminologia comum em academias do Brasil. ' +
                    'Exemplos: "barbell bench press" → "Supino com Barra", ' +
                    '"dumbbell shoulder press" → "Desenvolvimento com Halteres", ' +
                    '"barbell curl" → "Rosca Direta com Barra", ' +
                    '"lat pulldown" → "Puxada Alta", ' +
                    '"leg press" → "Leg Press", ' +
                    '"deadlift" → "Levantamento Terra". ' +
                    'Mantenha nomes consagrados em inglês quando necessário (ex: Burpee, Plank). ' +
                    'Responda APENAS com a lista numerada traduzida, sem explicações.',
            },
            {
                role: 'user',
                content: lista,
            },
        ],
    });

    const linhas = res.choices[0].message.content.trim().split('\n');
    return linhas.map(l => l.replace(/^\d+\.\s*/, '').trim());
}

// ── MAPEAMENTO grupo muscular ─────────────────────────────────────────────────
const TARGET_MAP = {
    pectorals:               'Peitoral',
    biceps:                  'Bíceps',
    triceps:                 'Tríceps',
    delts:                   'Ombros',
    abs:                     'Abdômen',
    quads:                   'Pernas',
    hamstrings:              'Pernas',
    glutes:                  'Pernas',
    calves:                  'Panturrilha',
    lats:                    'Costas',
    'upper back':            'Costas',
    traps:                   'Costas',
    spine:                   'Costas',
    'levator scapulae':      'Costas',
    'cardiovascular system': 'Cardio',
    forearms:                'Antebraço',
    adductors:               'Pernas',
    abductors:               'Pernas',
    'serratus anterior':     'Peitoral',
};

const BODY_PART_MAP = {
    chest:        'Peitoral',
    back:         'Costas',
    shoulders:    'Ombros',
    'upper arms': 'Bíceps',
    'lower arms': 'Antebraço',
    waist:        'Abdômen',
    'upper legs': 'Pernas',
    'lower legs': 'Panturrilha',
    cardio:       'Cardio',
    neck:         'Costas',
};

function resolverGrupo(ex) {
    return TARGET_MAP[ex.target?.toLowerCase()]
        || BODY_PART_MAP[ex.bodyPart?.toLowerCase()]
        || ex.bodyPart;
}

function titleCase(str) {
    return str.toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase());
}

// ── CLOUDINARY upload ─────────────────────────────────────────────────────────
async function uploadGif(gifPath) {
    const result = await cloudinary.uploader.upload(gifPath, {
        folder:        'exercicios',
        resource_type: 'auto',
    });
    return result.secure_url;
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
    const todos = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));
    console.log(`\n📋 Total no JSON: ${todos.length} exercícios`);

    // Filtra apenas os que têm GIF disponível
    const comGif = todos.filter(ex => fs.existsSync(path.join(GIFS_DIR, `${ex.id}.gif`)));
    const semGif = todos.length - comGif.length;
    if (semGif > 0) console.log(`⚠️  ${semGif} exercícios sem GIF serão ignorados`);
    console.log(`\n🔤 Traduzindo ${comGif.length} nomes em lotes de ${BATCH_SIZE}...\n`);

    // ── Tradução em lotes ──
    const traducoes = new Map(); // id → nome traduzido

    for (let i = 0; i < comGif.length; i += BATCH_SIZE) {
        const lote = comGif.slice(i, i + BATCH_SIZE);
        const loteNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalLotes = Math.ceil(comGif.length / BATCH_SIZE);
        process.stdout.write(`  Lote ${loteNum}/${totalLotes}... `);

        try {
            const nomes = lote.map(ex => ex.name);
            const traduzidos = await traduzirLote(nomes);

            lote.forEach((ex, idx) => {
                const nome = traduzidos[idx] ? titleCase(traduzidos[idx]) : titleCase(ex.name);
                traducoes.set(ex.id, nome);
            });
            console.log(`✅`);
        } catch (err) {
            console.log(`❌ Erro: ${err.message} — usando nomes originais`);
            lote.forEach(ex => traducoes.set(ex.id, titleCase(ex.name)));
        }
    }

    // ── Inserção ──
    console.log(`\n⬆️  Iniciando upload e inserção...\n`);
    let inseridos = 0;
    let pulados   = 0;
    let erros     = 0;

    for (let i = 0; i < comGif.length; i++) {
        const ex     = comGif[i];
        const prefix = `[${i + 1}/${comGif.length}]`;
        const nome   = traducoes.get(ex.id);
        const grupo  = resolverGrupo(ex);

        try {
            // Verifica duplicata
            const { rows } = await db.query(
                'SELECT id FROM exercicios WHERE LOWER(nome_exercicio) = LOWER($1)',
                [nome]
            );
            if (rows.length > 0) {
                console.log(`${prefix} ↩️  Já existe: "${nome}"`);
                pulados++;
                continue;
            }

            // Upload Cloudinary
            const gifPath = path.join(GIFS_DIR, `${ex.id}.gif`);
            const gif_url = await uploadGif(gifPath);

            // Insere no banco
            await db.query(
                `INSERT INTO exercicios (nome_exercicio, grupo_muscular, nivel, gif_url)
                 VALUES ($1, $2, NULL, $3)`,
                [nome, grupo, gif_url]
            );

            console.log(`${prefix} ✅ "${nome}" (${grupo})`);
            inseridos++;

        } catch (err) {
            console.error(`${prefix} ❌ "${nome}": ${err.message}`);
            erros++;
        }
    }

    console.log(`\n─────────────────────────────`);
    console.log(`✅ Inseridos:  ${inseridos}`);
    console.log(`↩️  Pulados:   ${pulados}`);
    console.log(`❌ Erros:      ${erros}`);
    console.log(`─────────────────────────────\n`);

    process.exit(0);
}

main();
