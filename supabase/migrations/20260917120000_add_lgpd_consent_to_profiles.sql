-- LGPD (17/09/2026) — consentimento explícito no cadastro do PrecificaPRO
--
-- Contexto: o app coleta dados pessoais (nome, e-mail, telefone, CNPJ, regime
-- tributário, atividade, plataformas, SKUs, pedidos/dia, cidade/UF) no cadastro de
-- 3 passos e não guardava nenhum registro de consentimento — pendência LGPD real.
--
-- Estes campos guardam a PROVA do aceite:
--   consentimento_aceito  — aceite explícito (default false: usuário antigo fica "sem aceite"
--                           e o banner de re-consentimento o cobre no próximo login)
--   consentimento_em      — data/hora (UTC) do PRIMEIRO aceite
--   consentimento_versao  — versão da Política aceita (ex: lgpd-v1-2026-09-17)
--
-- Aplicada em produção via MCP (apply_migration add_lgpd_consent_to_profiles);
-- mantida aqui para o repo refletir o banco. É aditiva e idempotente.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS consentimento_aceito boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS consentimento_em timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS consentimento_versao text;

COMMENT ON COLUMN public.profiles.consentimento_aceito IS 'LGPD: aceite explicito da Politica de Privacidade (passo 3 do cadastro)';
COMMENT ON COLUMN public.profiles.consentimento_em IS 'LGPD: data/hora (UTC) do aceite da Politica de Privacidade';
COMMENT ON COLUMN public.profiles.consentimento_versao IS 'LGPD: versao da Politica de Privacidade aceita (ex: lgpd-v1-2026-09-17)';
