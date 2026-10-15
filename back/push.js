const express = require('express');
const webpush  = require('web-push');
const db       = require('./db');
const { authenticate } = require('./middleware/auth');
const router   = express.Router();

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_EMAIL || 'mailto:admin@olympus.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

// GET /push/vapid-public-key
router.get('/vapid-public-key', (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
});

// POST /push/subscribe
// A inscrição é sempre gravada para o usuário do token (antes vinha do body,
// e qualquer um podia sequestrar as notificações de outra pessoa).
router.post('/subscribe', authenticate, async (req, res) => {
    const { subscription } = req.body || {};
    const endpoint = subscription?.endpoint;
    const p256dh = subscription?.keys?.p256dh;
    const auth = subscription?.keys?.auth;
    if (typeof endpoint !== 'string' || !/^https:\/\//.test(endpoint) || !p256dh || !auth) {
        return res.status(400).json({ error: 'Subscription inválida.' });
    }

    await db.query(
        `INSERT INTO push_subscriptions (usuario_id, endpoint, p256dh, auth)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (endpoint) DO UPDATE SET usuario_id = $1, p256dh = $3, auth = $4`,
        [req.user.userId, endpoint, p256dh, auth]
    );
    res.status(201).json({ ok: true });
});

// DELETE /push/unsubscribe — só remove inscrições do próprio usuário
router.delete('/unsubscribe', authenticate, async (req, res) => {
    const { endpoint } = req.body || {};
    await db.query(
        'DELETE FROM push_subscriptions WHERE endpoint = $1 AND usuario_id = $2',
        [endpoint, req.user.userId]
    );
    res.json({ ok: true });
});

// Helper exportado: enviar push para um usuário
async function enviarPush(usuarioId, payload) {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;
    try {
        const { rows } = await db.query(
            'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE usuario_id = $1',
            [usuarioId]
        );
        for (const sub of rows) {
            try {
                await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    JSON.stringify(payload)
                );
            } catch (err) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await db.query(
                        'DELETE FROM push_subscriptions WHERE endpoint = $1',
                        [sub.endpoint]
                    );
                }
            }
        }
    } catch (err) {
        console.error('Erro ao enviar push:', err);
    }
}

module.exports = router;
module.exports.enviarPush = enviarPush;
