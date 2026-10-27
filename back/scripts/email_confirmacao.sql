-- Confirmação de email (cadastro e troca de email). Rodar uma vez.
--
-- 1) Colunas novas. O DEFAULT true preenche os usuários que já existem:
--    quem já usava o app é considerado confirmado.
ALTER TABLE usuarios
    ADD COLUMN email_verificado    boolean NOT NULL DEFAULT true,
    ADD COLUMN email_pendente      varchar(255),
    ADD COLUMN email_token         varchar(64),
    ADD COLUMN email_token_expires timestamptz;

-- 2) A partir daqui, conta nova nasce sem confirmação
--    (o cadastro também grava false explicitamente).
ALTER TABLE usuarios ALTER COLUMN email_verificado SET DEFAULT false;
