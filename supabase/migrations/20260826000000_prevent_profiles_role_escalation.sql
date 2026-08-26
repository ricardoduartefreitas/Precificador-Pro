-- FIX 2 (crítico — segurança): bloqueia escalação de privilégio via profiles.role
--
-- Vulnerabilidade: authenticated (e anon) tinham GRANT de UPDATE em public.profiles;
-- a policy RLS profiles_update_own só verificava auth.uid() = id, sem restringir
-- colunas — qualquer usuário autenticado podia fazer PATCH em profiles definindo
-- role='admin' para si mesmo.
--
-- Correção: trigger BEFORE UPDATE que bloqueia qualquer alteração da coluna role
-- a menos que quem execute seja service_role ou já seja admin (via is_admin()).
-- RLS não restringe colunas individuais — é necessário um trigger para isso.
--
-- Testado em 26/08/2026 (via SET LOCAL ROLE authenticated + JWT claims simulados):
--   (a) usuário normal → UPDATE role='admin'           → BLOQUEADO (insufficient_privilege)
--   (b) admin → UPDATE role de outro usuário            → OK
--   (c) usuário normal → UPDATE nome/telefone (sem role) → OK (onboarding não quebra)

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF auth.role() = 'service_role' OR public.is_admin() THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Alteração da coluna role não autorizada — apenas admins podem alterar roles'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;

CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();
