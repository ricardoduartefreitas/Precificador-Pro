// supabase/functions/send-invite/index.ts
// Edge function para enviar convites de acesso ao Painel Admin
// Chamada POST com { nome, email }

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

    // Verificar se o email já existe na tabela auth.users (via admin)
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.warn("Aviso ao listar users:", listError);
    }

    const userExists = existingUsers?.users?.some(u => u.email === email);

    if (userExists) {
      return new Response(
        JSON.stringify({ message: "Este e-mail já está registrado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar um convite usando auth.admin.inviteUserByEmail
    // Isso envia um email com link de confirmação
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
    // Tabela: public.invites_log
    const { error: auditError } = await supabase
      .from("invites_log")
      .insert({
        invited_email: email,
        invited_by_id: user.id,
        nome: nome,
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (auditError) {
      console.warn("Aviso: Falha ao registrar convite em log:", auditError);
      // Não falhar a requisição se o log falhar — o convite já foi enviado
    }

    return new Response(
      JSON.stringify({
        message: "Convite enviado com sucesso",
        email: email,
        status: "sent",
        invited_user_id: inviteData?.user?.id,
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
