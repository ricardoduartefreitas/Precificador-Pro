# Teste Manual — Painel Admin

## Checklist de Testes

### ✅ Teste 1: Login como Admin

**Pré-requisito**: Ter uma conta de admin no Supabase
- Email: admin do projeto (verifique em Supabase → Authentication → Users)
- Senha: A senha do admin

**Steps**:

1. Ir para https://precificador.ruahtecnologia.com.br
2. Clicar em "Criar conta" e preencher com email admin
3. Confirmar email (ir em Supabase → Auth → Users → Copy invite link)
4. Definir password
5. Voltar ao app e fazer login

**Esperado**:
- ✓ Login bem-sucedido
- ✓ Redirecionamento para view "Calcular"
- ✓ **Nova aba "Painel Admin" aparece no header** (entre "Histórico" e o logout)
- ✓ Plan badge mostra "FREE" ou "PRO"

---

### ✅ Teste 2: Acessar Painel Admin

**Steps**:

1. (Assumindo login como admin, veja Teste 1)
2. Clicar na aba "Painel Admin" no header

**Esperado**:
- ✓ View "Painel Admin" é exibida
- ✓ Formulário de convite está visível:
  - Input "Nome completo"
  - Input "E-mail"
  - Botão "Enviar convite"
- ✓ Título "Usuários convidados"
- ✓ Mensagem "Nenhum convite enviado ainda" (se primeira vez)

---

### ✅ Teste 3: Enviar Convite (sem edge function)

⚠️ **Nota**: Este teste falhará com erro até que a edge function `send-invite` seja deployada no Supabase.

**Steps**:

1. Preencher o formulário:
   - Nome: "João Silva"
   - E-mail: "joao+test@seu-dominio.com"
2. Clicar "Enviar convite"

**Esperado (ANTES da edge function)**:
- ✗ Erro: "Failed to fetch" ou similar
- ✗ Toast de erro vermelho

**Esperado (DEPOIS da edge function)**:
- ✓ Toast verde: "✅ Convite enviado com sucesso!"
- ✓ Inputs limpam automaticamente
- ✓ E-mail de convite é recebido em joao+test@seu-dominio.com
- ✓ Convidado aparece na lista com status "⏳ Convite enviado"

---

### ✅ Teste 4: Verificar Proteção — Cliente NÃO vê tab

**Pré-requisito**: Ter uma conta de cliente (role = 'client')

**Steps**:

1. Logout (clicar botão logout no header)
2. Criar nova conta de teste:
   - Email: "cliente@teste.com"
   - Password: "123456"
   - Confirmar email
   - Fazer login
3. Observar o header

**Esperado**:
- ✓ Aba "Painel Admin" **NÃO aparece** (style="display: none")
- ✓ Apenas abas "Calcular", "Comparar", "Histórico" aparecem
- ✓ Se tentar acessar via URL (#/admin-panel), é redirecionado para #/calcular

---

### ✅ Teste 5: Tentativa de Acesso Direto (cliente)

**Steps**:

1. (Assumindo login como cliente, veja Teste 4)
2. Abrir console do navegador (F12)
3. Copiar e executar:
   ```javascript
   window.location.hash = '#/admin-panel'
   ```

**Esperado**:
- ✓ URL muda para #/admin-panel **por um momento**
- ✓ Redirecionado **imediatamente** de volta para #/calcular
- ✓ Tab de admin ainda não aparece

---

### ✅ Teste 6: Navegação entre Tabs

**Steps**:

1. (Assumindo login como admin)
2. Ir para Painel Admin
3. Clicar em "Calcular"
4. Clicar em "Comparar"
5. Clicar em "Histórico"
6. Clicar em "Painel Admin" novamente

**Esperado**:
- ✓ Navegação funciona normalmente
- ✓ Cada tab mostra seu conteúdo
- ✓ Botão de tab ativo está com classe "active"

---

### ✅ Teste 7: Logout e Reconexão

**Steps**:

1. (Assumindo login como admin com tab visível)
2. Clicar botão "Logout"
3. Login novamente como admin

**Esperado**:
- ✓ Após logout: view muda para login, header desaparece
- ✓ Após re-login: header reaparece com aba de admin visível
- ✓ Sem erros no console

---

## Verificação no Console (DevTools)

### Debug: Verificar role do usuário

```javascript
// Abrir Console (F12 → Console)

// Ver o estado de autenticação atual
import('./js/auth.js').then(auth => {
  console.log('Auth:', auth.getAuth());
  console.log('IsAdmin:', auth.isAdmin());
});
```

### Debug: Verificar visibilidade da tab

```javascript
// Encontrar o button de admin
const adminBtn = document.querySelector('.tab-btn.admin-only');
console.log('Admin btn exists:', !!adminBtn);
console.log('Admin btn display:', window.getComputedStyle(adminBtn).display);
```

### Debug: Verificar view admin

```javascript
// Ver se a view existe
const adminView = document.getElementById('view-admin-panel');
console.log('Admin view exists:', !!adminView);
console.log('Admin view hidden:', adminView.classList.contains('hidden'));
```

---

## Checklist Final

- [ ] Tab "Painel Admin" aparece para admin
- [ ] Tab "Painel Admin" **não** aparece para cliente
- [ ] Formulário de convite renderiza corretamente
- [ ] Botão "Enviar convite" está funcional
- [ ] Navegação entre tabs funciona
- [ ] Logout/login preserva estado da tab
- [ ] Edge function `send-invite` está deployada no Supabase
- [ ] Convites são enviados com sucesso
- [ ] Convidados aparecem na lista
- [ ] Console não mostra erros críticos

---

## Resultados

| Data | Teste | Status | Notas |
|------|-------|--------|-------|
| 14/08/2026 | Implementação Frontend | ✅ PASS | Tab, view e formulário implementados |
| - | Edge Function Deploy | ⏳ PENDING | Aguardando deploy no Supabase |
| - | Teste de Convite | ⏳ PENDING | Depende da edge function |
| - | Teste de Proteção | ⏳ PENDING | Após edge function |

---

## Próximos Passos

1. [ ] Deploy da edge function `send-invite` no Supabase
2. [ ] Criar tabela `invites_log` no banco (se não existir)
3. [ ] Testar envio de convites
4. [ ] Validar emails dos convidados
5. [ ] Implementar interface de resgate de convite

