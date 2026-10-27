-- Contas de teste em produção: não aparecem para usuários reais nem se
-- conectam com eles (ver SQL_VISIVEL / mundosDiferentes em middleware/auth.js).
-- Marcar uma conta: UPDATE usuarios SET conta_teste = true WHERE id = ...;
ALTER TABLE usuarios ADD COLUMN conta_teste boolean NOT NULL DEFAULT false;
