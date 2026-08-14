# Setup — Painel Admin com Convites

## Status da Implementação

✅ **Frontend**: Painel Admin implementado (aba visível apenas para admin)
❌ **Backend**: Edge function `send-invite` precisa ser criada no Supabase

---

## Como criar a Edge Function no Supabase

### 1. Acesso ao projeto Supabase

**Projeto**: `precificador-pro-2026`  
**URL**: https://ztzbqmbnlqafsazvwjyw.supabase.co  
**ID do Projeto**: `ztzbqmbnlqafsazvwjyw`

### 2. Criar a função via CLI ou Dashboard

#### Opção A: Via Dashboard Supabase (mais rápido)

1. Ir para **Functions** → **Create a new function**
2. Nome da função: `send-invite`
3. Copiar o código abaixo:

```typescript
// supabase/functions/send-invite/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validar token do usuário (deve ser admin)
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ message: "Token não fornecido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse body
    const { nome, email } = await req.json();

    if (!nome || !email) {
      return new Response(
        JSON.stringify({ message: "Nome e email são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Inicializar Supabase com service role key (pega do ambiente)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verificar se o usuário autenticado é admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ message: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se é admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return new Response(
        JSON.stringify({ message: "Acesso negado. Apenas admins podem enviar convites." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se o email já existe
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users?.some(u => u.email === email);

    if (userExists) {
      return new Response(
        JSON.stringify({ message: "Este e-mail já está registrado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar um convite (usar auth.admin.inviteUserByEmail)
    // Nota: Isso envia um email com link de confirmação
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          nome: nome,
          invited_by: user.id,
          invited_at: new Date().toISOString(),
        },
      }
    );

    if (inviteError) {
      console.error("Erro ao enviar convite:", inviteError);
      return new Response(
        JSON.stringify({ message: `Erro ao enviar convite: ${inviteError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Registrar o convite em uma tabela de auditoria (opcional)
    const { error: auditError } = await supabase
      .from("invites_log")
      .insert({
        invited_email: email,
        invited_by_id: user.id,
        nome: nome,
        status: "sent",
        sent_at: new Date().toISOString(),
      });

    if (auditError) {
      console.warn("Aviso: Falha ao registrar convite em log:", auditError);
      // Não falhar a requisição se o log falhar
    }

    return new Response(
      JSON.stringify({
        message: "Convite enviado com sucesso",
        email: email,
        status: "sent",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro geral:", error);
    return new Response(
      JSON.stringify({ message: `Erro interno: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

4. Salvar e fazer deploy

#### Opção B: Via CLI (Supabase CLI)

```bash
# Instalar Supabase CLI se ainda não tiver
brew install supabase/tap/supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref ztzbqmbnlqafsazvwjyw

# Criar a função
supabase functions new send-invite

# Cole o código acima em supabase/functions/send-invite/index.ts

# Deploy
supabase functions deploy send-invite
```

---

## 3. Atualizar permissões RLS (opcional)

Se necessário, adicionar uma política RLS na tabela `invites_log` para permitir que admins insiram registros.

---

## 4. Testar a implementação

### Teste 1: Verificar se tab de admin aparece

1. Login como admin no app
2. Verificar se a tab "Painel Admin" aparece no header

### Teste 2: Enviar um convite

1. Ir para "Painel Admin"
2. Preencher nome e e-mail
3. Clicar em "Enviar convite"
4. Verificar se:
   - Mensagem de sucesso aparece
   - E-mail é recebido no inbox de teste
   - Convite aparece na lista

### Teste 3: Cliente NÃO vê a tab

1. Logout
2. Login como cliente (não-admin)
3. Verificar que a tab "Painel Admin" NÃO aparece

---

## Próximos passos

- [ ] Criar edge function `send-invite`
- [ ] Testar envio de convites
- [ ] Adicionar table `invites_log` ao Supabase (se não existir)
- [ ] Melhorar UI do painel admin (adicionar ícones, loading states, etc.)
- [ ] Implementar cancelamento/resgate de convites

---

## Referências

- [Supabase Auth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-inviteUserByEmail)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Auth RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
