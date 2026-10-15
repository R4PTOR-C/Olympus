// assinaturas.js — Planos de professor via Google Play Billing
//
// Regra central: o app NUNCA decide o plano. Ele só entrega o purchaseToken;
// quem consulta a Google e grava o direito é este módulo.
//
// Fluxos:
//   1. Compra     → app chama POST /assinaturas/google/validar
//   2. Restaurar  → app chama POST /assinaturas/google/restaurar
//   3. Renovação  → Google chama POST /assinaturas/google/rtdn (Pub/Sub push)

const express = require('express');
const crypto  = require('crypto');
const db      = require('./db');
const { authenticate } = require('./middleware/auth');
const googleplay = require('./config/googleplay');

const router = express.Router();

// ID do produto na Play Console → plano interno
const PRODUTOS = {
    olympus_pro_mensal:   'pro',
    olympus_elite_mensal: 'elite',
};

// subscriptionState da Google → status interno.
// `direito: true` = o professor usa o plano; expira_em ainda é checado à parte.
const ESTADOS = {
    SUBSCRIPTION_STATE_ACTIVE:          { status: 'ativa',     direito: true  },
    SUBSCRIPTION_STATE_IN_GRACE_PERIOD: { status: 'grace',     direito: true  },
    SUBSCRIPTION_STATE_CANCELED:        { status: 'cancelada', direito: true  }, // vale até expirar
    SUBSCRIPTION_STATE_ON_HOLD:         { status: 'em_espera', direito: false },
    SUBSCRIPTION_STATE_PAUSED:          { status: 'pausada',   direito: false },
    SUBSCRIPTION_STATE_PENDING:         { status: 'pendente',  direito: false },
    SUBSCRIPTION_STATE_EXPIRED:         { status: 'expirada',  direito: false },
};

const STATUS_COM_DIREITO = Object.values(ESTADOS)
    .filter(e => e.direito)
    .map(e => e.status);

// ─────────────────────────────────────────
// LEITURA DO PLANO
// ─────────────────────────────────────────

// Plano vigente do usuário. A tabela `assinaturas` é a fonte da verdade; a
// coluna professores.plano só é consultada para quem nunca assinou pela loja
// (permite concessão manual de plano sem ser sobrescrita).
async function planoDoUsuario(usuarioId) {
    const { rows } = await db.query(
        `SELECT COALESCE(
            (SELECT a.plano
               FROM assinaturas a
              WHERE a.usuario_id = $1
                AND a.status = ANY($2::text[])
                AND (a.expira_em IS NULL OR a.expira_em > NOW())
              ORDER BY CASE a.plano WHEN 'elite' THEN 2 WHEN 'pro' THEN 1 ELSE 0 END DESC
              LIMIT 1),
            CASE WHEN EXISTS (SELECT 1 FROM assinaturas a2 WHERE a2.usuario_id = $1)
                 THEN 'gratuito'
                 ELSE (SELECT p.plano FROM professores p WHERE p.usuario_id = $1)
            END,
            'gratuito'
         ) AS plano`,
        [usuarioId, STATUS_COM_DIREITO]
    );
    return rows[0]?.plano || 'gratuito';
}

// Recalcula e espelha o plano em professores.plano (usado por telas antigas).
async function recalcularPlano(usuarioId) {
    const plano = await planoDoUsuario(usuarioId);
    await db.query(
        `UPDATE professores SET plano = $1 WHERE usuario_id = $2`,
        [plano, usuarioId]
    );
    return plano;
}

// ─────────────────────────────────────────
// SINCRONIZAÇÃO COM A GOOGLE
// ─────────────────────────────────────────

// Traduz a resposta da subscriptionsv2 para as colunas da tabela.
function interpretar(compra) {
    const item = compra.lineItems?.[0];
    const productId = item?.productId;
    const plano = PRODUTOS[productId];
    if (!plano) {
        const err = new Error(`Produto não reconhecido: ${productId}`);
        err.code = 'PRODUTO_DESCONHECIDO';
        throw err;
    }
    const estado = ESTADOS[compra.subscriptionState] || { status: 'desconhecida', direito: false };
    return {
        productId,
        plano,
        status: estado.status,
        temDireito: estado.direito,
        expiraEm: item?.expiryTime ? new Date(item.expiryTime) : null,
        autoRenova: Boolean(item?.autoRenewingPlan?.autoRenewEnabled),
        orderId: compra.latestOrderId || null,
        precisaConfirmar: compra.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING',
        contaExterna: compra.externalAccountIdentifiers?.obfuscatedExternalAccountId || null,
        teste: Boolean(compra.testPurchase),
    };
}

async function gravar(usuarioId, purchaseToken, dados) {
    await db.query(
        `INSERT INTO assinaturas
            (usuario_id, store, product_id, plano, status, expira_em,
             auto_renova, purchase_token, order_id, conta_externa, ambiente_teste, atualizado_em)
         VALUES ($1, 'google', $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
         ON CONFLICT (store, purchase_token) DO UPDATE SET
             product_id    = EXCLUDED.product_id,
             plano         = EXCLUDED.plano,
             status        = EXCLUDED.status,
             expira_em     = EXCLUDED.expira_em,
             auto_renova   = EXCLUDED.auto_renova,
             order_id      = EXCLUDED.order_id,
             conta_externa = EXCLUDED.conta_externa,
             atualizado_em = NOW()`,
        [
            usuarioId, dados.productId, dados.plano, dados.status, dados.expiraEm,
            dados.autoRenova, purchaseToken, dados.orderId, dados.contaExterna, dados.teste,
        ]
    );
}

// Quem já é dono deste token, se alguém for.
async function donoDoToken(purchaseToken) {
    const { rows } = await db.query(
        `SELECT usuario_id FROM assinaturas WHERE store = 'google' AND purchase_token = $1`,
        [purchaseToken]
    );
    return rows[0]?.usuario_id ?? null;
}

// Consulta a Google, grava e devolve o plano resultante.
// `usuarioId` é obrigatório na primeira vez que o token aparece.
async function sincronizar(purchaseToken, usuarioId = null) {
    const compra = await googleplay.buscarAssinatura(purchaseToken);
    const dados = interpretar(compra);

    const dono = await donoDoToken(purchaseToken);
    if (dono !== null && usuarioId !== null && dono !== usuarioId) {
        // Mesma compra sendo reivindicada por outra conta — recusa.
        const err = new Error('Esta compra já está vinculada a outra conta.');
        err.code = 'TOKEN_DE_OUTRO_USUARIO';
        throw err;
    }
    const alvo = dono ?? usuarioId;
    if (alvo === null) {
        const err = new Error('Compra desconhecida e sem usuário para vincular.');
        err.code = 'SEM_DONO';
        throw err;
    }

    await gravar(alvo, purchaseToken, dados);

    // Sem acknowledge em até 3 dias o Google estorna a compra automaticamente.
    if (dados.precisaConfirmar) {
        try {
            await googleplay.confirmarAssinatura(dados.productId, purchaseToken);
        } catch (err) {
            // Não derruba o fluxo: o RTDN de renovação tenta de novo.
            console.error('Falha ao confirmar (acknowledge) assinatura:', err.message);
        }
    }

    const plano = await recalcularPlano(alvo);
    return { usuarioId: alvo, plano, dados };
}

// ─────────────────────────────────────────
// MEU PLANO
// GET /assinaturas/minha
// ─────────────────────────────────────────
router.get('/minha', authenticate, async (req, res) => {
    const usuarioId = parseInt(req.user.userId);
    try {
        const [plano, { rows }] = await Promise.all([
            planoDoUsuario(usuarioId),
            db.query(
                `SELECT store, product_id, plano, status, expira_em, auto_renova, ambiente_teste
                   FROM assinaturas
                  WHERE usuario_id = $1
                  ORDER BY atualizado_em DESC
                  LIMIT 1`,
                [usuarioId]
            ),
        ]);
        res.json({ plano, assinatura: rows[0] || null });
    } catch (err) {
        console.error('Erro ao buscar assinatura:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// ─────────────────────────────────────────
// VALIDAR COMPRA
// POST /assinaturas/google/validar  { purchaseToken }
// ─────────────────────────────────────────
router.post('/google/validar', authenticate, async (req, res) => {
    const usuarioId = parseInt(req.user.userId);
    const { purchaseToken } = req.body;

    if (!purchaseToken || typeof purchaseToken !== 'string') {
        return res.status(400).json({ error: 'purchaseToken obrigatório.' });
    }
    if (!googleplay.configurado()) {
        return res.status(503).json({ error: 'Billing não configurado no servidor.' });
    }

    try {
        const { plano, dados } = await sincronizar(purchaseToken, usuarioId);

        // Sinal extra de fraude: o app manda o userId como obfuscatedAccountId.
        // Só reclama quando a Google devolveu o campo e ele diverge.
        if (dados.contaExterna && dados.contaExterna !== String(usuarioId)) {
            console.warn(
                `Assinatura ${purchaseToken.slice(0, 12)}… com conta externa ` +
                `${dados.contaExterna} reivindicada por usuário ${usuarioId}.`
            );
        }

        res.json({ plano, status: dados.status, expira_em: dados.expiraEm, tem_direito: dados.temDireito });
    } catch (err) {
        if (err.code === 'TOKEN_DE_OUTRO_USUARIO') {
            return res.status(409).json({ error: err.message, code: err.code });
        }
        if (err.code === 'PRODUTO_DESCONHECIDO') {
            return res.status(400).json({ error: err.message, code: err.code });
        }
        if (err.status === 404 || err.status === 410) {
            return res.status(404).json({ error: 'Compra não encontrada na Google Play.' });
        }
        console.error('Erro ao validar assinatura:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// ─────────────────────────────────────────
// RESTAURAR COMPRAS (troca de aparelho / reinstalação)
// POST /assinaturas/google/restaurar  { tokens: [...] }
// ─────────────────────────────────────────
router.post('/google/restaurar', authenticate, async (req, res) => {
    const usuarioId = parseInt(req.user.userId);
    const tokens = Array.isArray(req.body.tokens) ? req.body.tokens.filter(t => typeof t === 'string') : [];

    if (!googleplay.configurado()) {
        return res.status(503).json({ error: 'Billing não configurado no servidor.' });
    }

    const resultados = [];
    for (const token of tokens.slice(0, 20)) {
        try {
            const { dados } = await sincronizar(token, usuarioId);
            resultados.push({ ok: true, plano: dados.plano, status: dados.status });
        } catch (err) {
            resultados.push({ ok: false, code: err.code || 'ERRO', error: err.message });
        }
    }

    try {
        res.json({ plano: await recalcularPlano(usuarioId), resultados });
    } catch (err) {
        console.error('Erro ao restaurar compras:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// ─────────────────────────────────────────
// NOTIFICAÇÕES EM TEMPO REAL DA GOOGLE (RTDN via Pub/Sub push)
// POST /assinaturas/google/rtdn?token=RTDN_SECRET
//
// Sem autenticação JWT — quem chama é o Pub/Sub. A proteção é o segredo na
// query string, configurado na subscription de push.
// ─────────────────────────────────────────
router.post('/google/rtdn', async (req, res) => {
    const esperado = process.env.RTDN_SECRET;
    const recebido = String(req.query.token || '');
    if (!esperado) {
        console.error('RTDN_SECRET não configurado — notificação recusada.');
        return res.sendStatus(503);
    }
    const a = Buffer.from(recebido);
    const b = Buffer.from(esperado);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return res.sendStatus(401);
    }

    const mensagem = req.body?.message;
    if (!mensagem?.data) return res.sendStatus(204); // nada a processar

    // Pub/Sub reentrega o que falhou; só pula o que já foi processado com
    // sucesso. Marcar antes de processar faria uma falha virar perda definitiva.
    const messageId = mensagem.messageId || null;
    if (messageId) {
        const { rows } = await db.query(
            `SELECT 1 FROM assinaturas_eventos WHERE message_id = $1`,
            [messageId]
        ).catch(err => {
            console.error('Erro no dedupe de RTDN:', err);
            return { rows: [] }; // processa de novo: sincronizar é idempotente
        });
        if (rows.length) return res.sendStatus(204);
    }

    const marcarProcessado = async () => {
        if (!messageId) return;
        await db.query(
            `INSERT INTO assinaturas_eventos (message_id) VALUES ($1)
             ON CONFLICT (message_id) DO NOTHING`,
            [messageId]
        ).catch(err => console.error('Erro ao marcar RTDN processado:', err));
    };

    let aviso;
    try {
        aviso = JSON.parse(Buffer.from(mensagem.data, 'base64').toString('utf8'));
    } catch {
        console.error('RTDN com payload inválido.');
        return res.sendStatus(204);
    }

    // Ping de teste disparado pelo Play Console
    if (aviso.testNotification) {
        console.log('RTDN de teste recebido da Google Play.');
        await marcarProcessado();
        return res.sendStatus(204);
    }

    const token =
        aviso.subscriptionNotification?.purchaseToken ||
        aviso.voidedPurchaseNotification?.purchaseToken;
    if (!token) return res.sendStatus(204);

    try {
        const dono = await donoDoToken(token);
        if (dono === null) {
            // Compra que nunca passou pelo /validar (app fechado antes de confirmar).
            // Nada a fazer aqui; o restaurar/validar do app resolve depois.
            console.warn('RTDN para token desconhecido — ignorado.');
            await marcarProcessado();
            return res.sendStatus(204);
        }

        if (aviso.voidedPurchaseNotification) {
            // Estorno: corta o direito na hora, sem consultar a Google.
            await db.query(
                `UPDATE assinaturas
                    SET status = 'reembolsada', auto_renova = FALSE, atualizado_em = NOW()
                  WHERE store = 'google' AND purchase_token = $1`,
                [token]
            );
            await recalcularPlano(dono);
            await marcarProcessado();
            return res.sendStatus(204);
        }

        await sincronizar(token);
        await marcarProcessado();
        return res.sendStatus(204);
    } catch (err) {
        console.error('Erro ao processar RTDN:', err);
        // 500 faz o Pub/Sub reentregar — melhor que perder a renovação.
        return res.sendStatus(500);
    }
});

module.exports = router;
module.exports.planoDoUsuario = planoDoUsuario;
module.exports.recalcularPlano = recalcularPlano;
module.exports.PRODUTOS = PRODUTOS;
