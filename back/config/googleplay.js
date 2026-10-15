// config/googleplay.js
// Cliente da Google Play Developer API (Android Publisher v3).
//
// Precisa de uma service account do Google Cloud com acesso concedido no
// Play Console (Usuários e permissões → permissão "Ver dados financeiros" e
// "Gerenciar pedidos e assinaturas" no app).
//
// Variáveis de ambiente:
//   ANDROID_PACKAGE_NAME      - ex: com.raptorc.olympus
//   GOOGLE_PLAY_CLIENT_EMAIL  - client_email do JSON da service account
//   GOOGLE_PLAY_PRIVATE_KEY   - private_key do JSON (com \n literais ou reais)

const { JWT } = require('google-auth-library');

const PACKAGE_NAME = process.env.ANDROID_PACKAGE_NAME || 'com.raptorc.olympus';
const BASE_URL = 'https://androidpublisher.googleapis.com/androidpublisher/v3';
const SCOPES = ['https://www.googleapis.com/auth/androidpublisher'];

let jwtClient = null;

// Está configurado? Permite o resto da API subir sem as credenciais.
const configurado = () =>
    Boolean(process.env.GOOGLE_PLAY_CLIENT_EMAIL && process.env.GOOGLE_PLAY_PRIVATE_KEY);

function getClient() {
    if (jwtClient) return jwtClient;
    if (!configurado()) {
        throw new Error('Google Play não configurado (GOOGLE_PLAY_CLIENT_EMAIL / GOOGLE_PLAY_PRIVATE_KEY).');
    }
    jwtClient = new JWT({
        email: process.env.GOOGLE_PLAY_CLIENT_EMAIL,
        // O Render guarda a chave com \n escapado; normaliza os dois formatos.
        key: process.env.GOOGLE_PLAY_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: SCOPES,
    });
    return jwtClient;
}

async function chamar(path, { method = 'GET', body } = {}) {
    const { token } = await getClient().getAccessToken();
    const res = await fetch(`${BASE_URL}/applications/${PACKAGE_NAME}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    const texto = await res.text();
    if (!res.ok) {
        const err = new Error(`Google Play API ${res.status}: ${texto}`);
        err.status = res.status;
        throw err;
    }
    return texto ? JSON.parse(texto) : {};
}

// purchases.subscriptionsv2.get — estado completo da assinatura
const buscarAssinatura = (purchaseToken) =>
    chamar(`/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`);

// purchases.subscriptions.acknowledge — sem isso o Google estorna em 3 dias
const confirmarAssinatura = (subscriptionId, purchaseToken) =>
    chamar(
        `/purchases/subscriptions/${encodeURIComponent(subscriptionId)}` +
        `/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`,
        { method: 'POST', body: {} }
    );

module.exports = { PACKAGE_NAME, configurado, buscarAssinatura, confirmarAssinatura };
