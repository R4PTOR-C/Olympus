-- moderacao.sql — Denúncias e bloqueios (exigidos pela política de conteúdo
-- gerado por usuários e de IA generativa da Google Play).
-- Rodar uma vez no banco de produção.

BEGIN;

-- Bloqueio entre usuários. Vale nos dois sentidos para efeito de contato:
-- se A bloqueou B, nenhum dos dois consegue mandar mensagem, pedir amizade
-- ou conexão para o outro.
CREATE TABLE IF NOT EXISTS bloqueios (
    id             SERIAL PRIMARY KEY,
    bloqueador_id  INTEGER     NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    bloqueado_id   INTEGER     NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT bloqueios_unico UNIQUE (bloqueador_id, bloqueado_id),
    CONSTRAINT bloqueios_nao_si_mesmo CHECK (bloqueador_id <> bloqueado_id)
);

CREATE INDEX IF NOT EXISTS idx_bloqueios_bloqueado ON bloqueios (bloqueado_id);

-- Denúncias de usuários, de mensagens do chat e de respostas do Hércules.
-- `conteudo` guarda uma cópia do que foi denunciado: a moderação continua
-- vendo o conteúdo mesmo se a mensagem ou a conta for apagada depois.
CREATE TABLE IF NOT EXISTS denuncias (
    id              SERIAL PRIMARY KEY,
    denunciante_id  INTEGER     REFERENCES usuarios(id) ON DELETE SET NULL,
    tipo            TEXT        NOT NULL CHECK (tipo IN ('usuario', 'mensagem', 'hercules')),
    denunciado_id   INTEGER     REFERENCES usuarios(id) ON DELETE SET NULL,
    referencia_id   INTEGER,                -- mensagens.id ou hercules_conversas.id
    conteudo        TEXT,
    motivo          TEXT        NOT NULL,
    detalhes        TEXT,
    status          TEXT        NOT NULL DEFAULT 'aberta'
                                CHECK (status IN ('aberta', 'procedente', 'descartada')),
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    analisada_em    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_denuncias_status ON denuncias (status, criado_em DESC);

COMMIT;
