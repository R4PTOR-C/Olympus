// billing.js — Assinatura do plano de professor via Google Play Billing.
//
// O plugin (cordova-plugin-purchase) só existe dentro do app nativo. No
// navegador tudo aqui vira no-op e `billingDisponivel()` devolve false, então
// a tela de planos consegue se degradar sozinha.
//
// O app nunca decide o plano: ele manda o purchaseToken pro backend, que
// consulta a Google Play Developer API e responde qual plano vale.

const API = process.env.REACT_APP_API_BASE_URL;

// plano interno → productId cadastrado na Play Console
export const PRODUTOS = {
    pro:   'olympus_pro_mensal',
    elite: 'olympus_elite_mensal',
};

const getStore = () => window.CdvPurchase?.store || null;

export const billingDisponivel = () => Boolean(getStore());

const auth = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
});

// ── Backend ──────────────────────────────────────────────────────────────────

async function validarNoBackend(purchaseToken) {
    const res = await fetch(`${API}/assinaturas/google/validar`, {
        method: 'POST',
        headers: auth(),
        body: JSON.stringify({ purchaseToken }),
    });
    const dados = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(dados.error || 'Não foi possível confirmar a assinatura.');
    return dados;
}

export async function buscarMinhaAssinatura() {
    const res = await fetch(`${API}/assinaturas/minha`, { headers: auth() });
    if (!res.ok) throw new Error('Não foi possível carregar sua assinatura.');
    return res.json();
}

// ── Inicialização ────────────────────────────────────────────────────────────

let promessaInit = null;
let aoAtualizarPlano = null;
let aoFalhar = null;

/**
 * Inicializa o billing. Pode ser chamado várias vezes — só roda de fato uma.
 *
 * @param usuarioId        id do professor logado (vira o obfuscatedAccountId na Google)
 * @param onPlanoAtualizado callback(plano) quando o backend confirma uma compra
 * @param onErro            callback(mensagem) quando a validação da compra falha
 * @returns Promise<boolean> true se o billing está de pé
 */
export function iniciarBilling({ usuarioId, onPlanoAtualizado, onErro }) {
    aoAtualizarPlano = onPlanoAtualizado;
    aoFalhar = onErro;

    const store = getStore();
    if (!store) return Promise.resolve(false);
    if (promessaInit) return promessaInit;

    const { ProductType, Platform, LogLevel } = window.CdvPurchase;

    store.verbosity = LogLevel.WARNING;

    // Amarra a compra ao usuário do Olympus. 'disabled' manda o valor cru — é
    // só o id numérico interno, não é dado pessoal.
    store.obfuscator = 'disabled';
    store.applicationUsername = () => String(usuarioId);

    store.register(
        Object.values(PRODUTOS).map(id => ({
            id,
            type: ProductType.PAID_SUBSCRIPTION,
            platform: Platform.GOOGLE_PLAY,
        }))
    );

    store.when().approved(async (transaction) => {
        const purchaseToken = transaction.nativePurchase?.purchaseToken;
        if (!purchaseToken) return;
        try {
            const { plano } = await validarNoBackend(purchaseToken);
            // Só finaliza depois que o servidor reconheceu a compra.
            await transaction.finish();
            aoAtualizarPlano?.(plano);
        } catch (err) {
            // Não finaliza: a Google reentrega a transação na próxima abertura
            // do app, e o backend também confirma pelo RTDN. Mas o usuário
            // precisa sair do estado "comprando", senão o botão trava.
            console.error('Falha ao validar compra:', err);
            aoFalhar?.(
                'O pagamento foi feito, mas não conseguimos confirmar agora. ' +
                'Abra o app de novo em instantes ou use "Restaurar compras".'
            );
        }
    });

    promessaInit = store
        .initialize([Platform.GOOGLE_PLAY])
        .then(() => true)
        .catch((err) => {
            console.error('Falha ao inicializar billing:', err);
            promessaInit = null;
            return false;
        });

    return promessaInit;
}

// ── Ações ────────────────────────────────────────────────────────────────────

/**
 * Preço formatado pela loja (ex: "R$ 29,90"), ou null se ainda não carregou.
 * Usa a última fase de cobrança — se o plano tiver teste grátis, a primeira
 * fase é R$ 0,00 e não é o que queremos mostrar no card.
 */
export function precoDaLoja(plano) {
    const store = getStore();
    if (!store) return null;
    const produto = store.get(PRODUTOS[plano], window.CdvPurchase.Platform.GOOGLE_PLAY);
    const fases = produto?.getOffer()?.pricingPhases;
    if (!fases?.length) return null;
    return fases[fases.length - 1].price || null;
}

/** Abre o fluxo de compra da Google. Resolve quando a folha de pagamento fecha. */
export async function assinar(plano) {
    const store = getStore();
    if (!store) throw new Error('Assinatura disponível apenas no aplicativo.');

    const produto = store.get(PRODUTOS[plano], window.CdvPurchase.Platform.GOOGLE_PLAY);
    const oferta = produto?.getOffer();
    if (!oferta) throw new Error('Plano indisponível na loja no momento.');

    const erro = await store.order(oferta);
    if (erro) throw new Error(erro.message || 'Compra não concluída.');
}

/** Reenvia ao backend todas as compras que o aparelho conhece. */
export async function restaurarCompras() {
    const store = getStore();
    if (!store) throw new Error('Disponível apenas no aplicativo.');

    await store.restorePurchases();

    const tokens = store.localTransactions
        .map(t => t.nativePurchase?.purchaseToken)
        .filter(Boolean);

    const res = await fetch(`${API}/assinaturas/google/restaurar`, {
        method: 'POST',
        headers: auth(),
        body: JSON.stringify({ tokens }),
    });
    const dados = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(dados.error || 'Não foi possível restaurar.');

    return dados.plano;
}

/** Abre a tela de assinaturas da Play Store. */
export function gerenciarAssinatura() {
    const store = getStore();
    if (!store) return;
    store.manageSubscriptions(window.CdvPurchase.Platform.GOOGLE_PLAY);
}
