// Testes unitários (sem banco): node --test
const test = require('node:test');
const assert = require('node:assert');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'teste';

const { hojeSP, diaSemanaSP, sqlDiaSP } = require('../config/datas');
const { calcNivel, NIVEIS } = require('../gamificacao_engine');
const { ehAdmin, ehProprioUsuario } = require('../middleware/auth');

test('hojeSP usa o fuso de Brasília (21h30 em SP já é dia seguinte em UTC)', () => {
    assert.strictEqual(hojeSP(new Date('2026-10-15T00:30:00Z')), '2026-10-14');
    assert.strictEqual(hojeSP(new Date('2026-10-15T03:30:00Z')), '2026-10-15');
});

test('diaSemanaSP segue o fuso de Brasília', () => {
    // 2026-10-15T01:00Z = quarta 22h em SP
    assert.strictEqual(diaSemanaSP(new Date('2026-10-15T01:00:00Z')), 3);
    assert.strictEqual(diaSemanaSP(new Date('2026-10-15T12:00:00Z')), 4);
});

test('sqlDiaSP converte a coluna para data no fuso de SP', () => {
    assert.match(sqlDiaSP('created_at'), /created_at\)::timestamptz AT TIME ZONE 'America\/Sao_Paulo'\)::date/);
});

test('calcNivel: limites dos níveis', () => {
    assert.strictEqual(NIVEIS.length, 24);
    assert.strictEqual(calcNivel(0).nivel, 1);
    assert.strictEqual(calcNivel(199).tier, 1);
    assert.strictEqual(calcNivel(200).tier, 2);
    assert.strictEqual(calcNivel(8000).nome, 'Olimpiano I');
    assert.strictEqual(calcNivel(999999).nivel, 24);
    assert.ok(calcNivel(999999).pct <= 1);
});

test('ehAdmin lê ADMIN_USER_IDS', () => {
    process.env.ADMIN_USER_IDS = '1, 7';
    assert.strictEqual(ehAdmin({ user: { userId: 7 } }), true);
    assert.strictEqual(ehAdmin({ user: { userId: '1' } }), true);
    assert.strictEqual(ehAdmin({ user: { userId: 2 } }), false);
    process.env.ADMIN_USER_IDS = '';
    assert.strictEqual(ehAdmin({ user: { userId: 1 } }), false);
});

test('ehProprioUsuario compara ids numéricos', () => {
    assert.strictEqual(ehProprioUsuario({ user: { userId: 5 } }, '5'), true);
    assert.strictEqual(ehProprioUsuario({ user: { userId: 5 } }, '6'), false);
    assert.strictEqual(ehProprioUsuario({ user: { userId: 5 } }, undefined), false);
});
