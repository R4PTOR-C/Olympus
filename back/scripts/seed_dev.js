// Cria as contas de teste do banco LOCAL (olympus_dev) pelo mesmo caminho do app:
// cadastro → login → perfil de professor. Precisa do backend local rodando.
//
//   node scripts/seed_dev.js            (API em http://localhost:5000)
//   API=http://localhost:5001 node scripts/seed_dev.js
//
// Recusa rodar contra qualquer coisa que não seja localhost.

const API = process.env.API || 'http://localhost:5000';
const SENHA = 'dev123456';

if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(API)) {
    console.error(`Recusado: ${API} não é local.`);
    process.exit(1);
}

const CONTAS = [
    { nome: 'Dev Aluno',     email: 'rafaelcroriz7+dev1@gmail.com', funcao: 'Aluno' },
    { nome: 'Dev Professor', email: 'rafaelcroriz7+dev2@gmail.com', funcao: 'Professor', professor: true },
    { nome: 'Dev Híbrido',   email: 'rafaelcroriz7+dev3@gmail.com', funcao: 'Aluno',     professor: true, extra: true },
];

const PERFIL_PROFESSOR = {
    cref: '000000-G/SP',
    especialidade: 'Hipertrofia',
    experiencia: 5,
    descricao: 'Conta de teste local.',
    preco_hora: 100,
    cidade: 'São Paulo',
    estado: 'SP',
    contato: '(11) 90000-0000',
};

async function req(caminho, { metodo = 'GET', corpo, token } = {}) {
    const res = await fetch(`${API}${caminho}`, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: corpo ? JSON.stringify(corpo) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${metodo} ${caminho}: ${res.status} ${data.error || ''}`);
    return data;
}

(async () => {
    for (const c of CONTAS) {
        const u = await req('/usuarios', { metodo: 'POST', corpo: { nome: c.nome, email: c.email, senha: SENHA, funcao: c.funcao } });
        const { token } = await req('/login', { metodo: 'POST', corpo: { email: c.email, senha: SENHA } });
        if (c.professor) {
            await req('/professores', { metodo: 'POST', token, corpo: { usuario_id: u.id, ...PERFIL_PROFESSOR } });
        }
        if (c.extra) {
            await req(`/usuarios/${u.id}/funcao-extra`, { metodo: 'PUT', token, corpo: { funcao_extra: 'Professor' } });
        }
        console.log(`#${u.id}  ${c.nome.padEnd(14)} ${c.email}`);
    }
    console.log(`\nSenha de todas: ${SENHA}`);
})().catch(err => { console.error(err.message); process.exit(1); });
