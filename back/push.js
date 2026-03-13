const express = require('express');
const webpush  = require('web-push');
const db       = require('./db');
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
router.post('/subscribe', async (req, res) => {
    const { usuarioId, subscription } = req.body;
    if (!subscription?.endpoint) return res.status(400).json({ error: 'Subscription inválida.' });

    const { endpoint, keys: { p256dh, auth } } = subscription;
    try {
        await db.query(
            `INSERT INTO push_subscriptions (usuario_id, endpoint, p256dh, auth)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (endpoint) DO UPDATE SET usuario_id = $1, p256dh = $3, auth = $4`,
            [usuarioId, endpoint, p256dh, auth]
        );
        res.status(201).json({ ok: true });
    } catch (err) {
        console.error('Erro ao salvar subscription:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// DELETE /push/unsubscribe
router.delete('/unsubscribe', async (req, res) => {
    const { endpoint } = req.body;
    try {
        await db.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: 'Erro interno.' });
    }
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
