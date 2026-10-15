-- assinaturas.sql — Planos de professor via lojas (Google Play, futuramente App Store)
-- Rodar uma vez no banco de produção.

BEGIN;

CREATE TABLE IF NOT EXISTS assinaturas (
    id             SERIAL PRIMARY KEY,
    usuario_id     INTEGER     NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    store          TEXT        NOT NULL DEFAULT 'google',
    product_id     TEXT        NOT NULL,   -- ex: olympus_pro_mensal
    plano          TEXT        NOT NULL,   -- 'pro' | 'elite'
    status         TEXT        NOT NULL,   -- ativa | grace | cancelada | em_espera |
                                           -- pausada | pendente | expirada | reembolsada
    expira_em      TIMESTAMPTZ,
    auto_renova    BOOLEAN     NOT NULL DEFAULT FALSE,
    purchase_token TEXT        NOT NULL,
    order_id       TEXT,
    conta_externa  TEXT,                   -- obfuscatedExternalAccountId devolvido pela Google
    ambiente_teste BOOLEAN     NOT NULL DEFAULT FALSE,
    criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Impede que a mesma compra seja reivindicada por duas contas.
    CONSTRAINT assinaturas_token_unico UNIQUE (store, purchase_token)
);

-- Consulta quente: "qual o plano vivo deste usuário?"
CREATE INDEX IF NOT EXISTS idx_assinaturas_usuario
    ON assinaturas (usuario_id, status, expira_em DESC);

-- Dedupe das notificações do Pub/Sub, que podem ser reentregues.
CREATE TABLE IF NOT EXISTS assinaturas_eventos (
    message_id  TEXT PRIMARY KEY,
    recebido_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;

-- Opcional: limpeza periódica do dedupe (o Pub/Sub não reentrega depois de 7 dias).
-- DELETE FROM assinaturas_eventos WHERE recebido_em < NOW() - INTERVAL '30 days';
