# Edge Function: send-invite

## Descrição

Esta edge function permite que admins enviem convites de acesso a novos usuários via Painel Admin.

## Endpoint

```
POST https://ztzbqmbnlqafsazvwjyw.supabase.co/functions/v1/send-invite
```

## Payload

```json
{
  "nome": "João Silva",
  "email": "joao@exemplo.com"
}
```

## Headers Obrigatórios

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Response — Success (200)

```json
{
  "message": "Convite enviado com sucesso",
  "email": "joao@exemplo.com",
  "status": "sent",
  "invited_user_id": "uuid-do-usuario"
}
```

## Response — Errors

### 401 Unauthorized
```json
{ "message": "Token não fornecido" }
```

### 403 Forbidden
```json
{ "message": "Acesso negado. Apenas admins podem enviar convites." }
```

### 400 Bad Request
```json
{ "message": "Nome e email são obrigatórios" }
```

## Como fazer deploy

### Via CLI (recomendado)

```bash
cd /home/ruahtech/precificador-repo

# 1. Fazer login no Supabase (se ainda não fez)
supabase login

# 2. Link ao projeto (primeira vez apenas)
supabase link --project-ref ztzbqmbnlqafsazvwjyw

# 3. Deploy da função
supabase functions deploy send-invite
```

### Via Dashboard

1. Ir para https://app.supabase.com/project/ztzbqmbnlqafsazvwjyw/functions
2. Criar nova função com nome `send-invite`
3. Colar o código de `index.ts`
4. Deploy

## Pré-requisitos

### 1. Tabela `invites_log` (opcional)

Se quiser registrar todos os convites enviados:

```sql
CREATE TABLE public.invites_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invited_email text NOT NULL,
  invited_by_id uuid NOT NULL REFERENCES auth.users(id),
  nome text,
  status text DEFAULT 'sent',
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- RLS: Allow insert only for authenticated users (admins)
ALTER TABLE public.invites_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can insert invites"
  ON public.invites_log
  FOR INSERT
  WITH CHECK (auth.uid() = invited_by_id);
```

### 2. Tabela `profiles` (deve existir)

A tabela `profiles` precisa ter uma coluna `role` (admin | client).

```sql
-- Verificar estrutura
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'profiles';
```

## Testes

### Test via curl

```bash
# 1. Get access token (fazer login primeiro no app)
# Copie o token de sessão no localStorage

# 2. Enviar convite
curl -X POST https://ztzbqmbnlqafsazvwjyw.supabase.co/functions/v1/send-invite \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao+test@exemplo.com"
  }'
```

## Notes

- O convite é enviado usando a API de Auth Admin do Supabase (`inviteUserByEmail`)
- O e-mail recebido terá um link de confirmação/criação de conta
- O usuário criado via convite terá `role = 'client'` por padrão
- Se a tabela `invites_log` não existir, o convite ainda será enviado (log é opcional)

## Troubleshooting

| Erro | Causa | Solução |
|------|-------|---------|
| "SUPABASE_URL não definido" | Env vars não configuradas | Verificar environment variables no Supabase Dashboard |
| "Acesso negado" | Usuário não é admin | Verificar role na tabela `profiles` |
| "Token não fornecido" | Header Authorization vazio | Passar `Authorization: Bearer <token>` |

